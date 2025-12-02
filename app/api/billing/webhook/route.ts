/**
 * POST /api/billing/webhook
 * 
 * Handles Razorpay webhooks for subscription events
 * 
 * IMPORTANT: Configure this webhook URL in Razorpay Dashboard:
 * - URL: https://your-domain.com/api/billing/webhook
 * - Events: subscription.activated, subscription.charged, subscription.cancelled, payment.failed
 * - Copy webhook secret and set as RAZORPAY_WEBHOOK_SECRET in .env
 * 
 * Security: Validates webhook signature using Razorpay secret
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDB } from "@/lib/firebase-admin";
import {
  assignPlanToWorkspace,
  mapPlanIdToPlanName,
  findUserByRazorpayId,
  cancelWorkspaceSubscription,
} from "@/lib/billing-utils";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify webhook signature
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error("[Webhook] Missing signature or secret");
      return NextResponse.json(
        { error: "Invalid webhook configuration" },
        { status: 400 }
      );
    }

    // 2. Read and verify body
    const body = await req.text();
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("[Webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // 3. Parse webhook payload
    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload?.subscription || event.payload?.payment;

    console.log(`[Webhook] Received event: ${eventType}`);

    // 4. Handle different event types
    switch (eventType) {
      case "subscription.activated":
      case "subscription.charged": {
        await handleSubscriptionActivated(payload, event);
        break;
      }

      case "order.paid": {
        await handleOrderPaid(payload, event);
        break;
      }

      case "subscription.cancelled": {
        await handleSubscriptionCancelled(payload);
        break;
      }

      case "payment.failed": {
        console.log(`[Webhook] Payment failed for subscription ${payload?.entity?.subscription_id}`);
        // Log but don't change plan yet - give user chance to retry
        break;
      }

      default: {
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
      }
    }

    // 5. Return 200 quickly to acknowledge receipt
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle order paid event (One-time payment for plan)
 */
async function handleOrderPaid(payload: any, event: any) {
  try {
    const order = payload.order.entity;
    const payment = payload.payment.entity;
    
    const notes = order.notes || payment.notes;
    const { uid, planId, type } = notes;

    if (type !== "subscription_purchase") {
      console.log(`[Webhook] Ignoring order.paid for non-subscription purchase`);
      return;
    }

    if (!uid || !planId) {
      console.error("[Webhook] Missing uid or planId in order notes");
      return;
    }

    // Check for duplicate processing
    const eventId = event.id;
    const processedCheck = await adminDB.collection("processedWebhooks").doc(eventId).get();
    if (processedCheck.exists) {
      console.log(`[Webhook] Event ${eventId} already processed`);
      return;
    }

    console.log(`[Webhook] Processing order.paid for user ${uid}, plan ${planId}`);

    // Get user's current workspace
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const workspaceId = userData?.currentWorkspaceId;

    if (!workspaceId) {
      console.error(`[Webhook] No workspace found for user ${uid}`);
      return;
    }

    // 1. Update Workspace Plan
    await adminDB.collection("workspaces").doc(workspaceId).update({
        planId: planId,
        razorpayOrderId: order.id, // Store order ID instead of subscription ID
        updatedAt: Date.now()
    });

    // 2. Sync Plan to User (Owner)
    await adminDB.collection("users").doc(uid).update({
        planType: planId,
        updatedAt: Date.now()
    });

    // 3. Reset Usage for Current Month
    const date = new Date();
    const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    await adminDB
        .collection("workspaces")
        .doc(workspaceId)
        .collection("usage")
        .doc(monthId)
        .set({
            creditsUsed: 0,
            scraperUsed: 0,
            sequencesUsed: 0,
            templatesUsed: 0,
            smtpEmailsSent: 0,
            aiToneUsed: 0,
            resetDate: Date.now(),
            updatedAt: Date.now()
        });

    // Log analytics event
    await adminDB
      .collection("workspaces")
      .doc(workspaceId)
      .collection("events")
      .add({
        type: "plan_purchased",
        planId: planId,
        orderId: order.id,
        amount: payment.amount,
        timestamp: Date.now(),
      });

    // Mark webhook as processed
    await adminDB
      .collection("processedWebhooks")
      .doc(eventId)
      .set({
        eventType: "order.paid",
        orderId: order.id,
        uid,
        workspaceId,
        planId,
        processedAt: Date.now(),
      });

    console.log(`[Webhook] Successfully activated ${planId} plan for workspace ${workspaceId}`);

  } catch (error) {
    console.error("[Webhook] Error handling order paid:", error);
    throw error;
  }
}

/**
 * Handle subscription activation/charge event
 */
async function handleSubscriptionActivated(subscription: any, event: any) {
  try {
    const subscriptionId = subscription.id;
    const planId = subscription.plan_id;
    const customerId = subscription.customer_id;

    // Check for duplicate processing (idempotency)
    const eventId = event.id || subscriptionId;
    const processedCheck = await adminDB
      .collection("processedWebhooks")
      .doc(eventId)
      .get();

    if (processedCheck.exists) {
      console.log(`[Webhook] Event ${eventId} already processed`);
      return;
    }

    // Find user by pending subscription ID or customer ID
    let uid = await findUserByRazorpayId("pendingSubscriptionId", subscriptionId);
    if (!uid) {
      uid = await findUserByRazorpayId("razorpaySubscriptionId", subscriptionId);
    }
    if (!uid) {
      uid = await findUserByRazorpayId("razorpayCustomerId", customerId);
    }

    if (!uid) {
      console.error(`[Webhook] User not found for subscription ${subscriptionId}`);
      return;
    }

    // Get user's current workspace
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const workspaceId = userData?.currentWorkspaceId;

    if (!workspaceId) {
      console.error(`[Webhook] No workspace found for user ${uid}`);
      return;
    }

    // Map plan ID to plan name
    const newPlanId = mapPlanIdToPlanName(planId);
    if (!newPlanId) {
      console.error(`[Webhook] Unknown plan ID: ${planId}`);
      return;
    }

    // 1. Update Workspace Plan
    await adminDB.collection("workspaces").doc(workspaceId).update({
        planId: newPlanId,
        razorpaySubscriptionId: subscriptionId,
        updatedAt: Date.now()
    });

    // 2. Sync Plan to User (Owner)
    await adminDB.collection("users").doc(uid).update({
        planType: newPlanId,
        updatedAt: Date.now()
    });

    // 3. Reset Usage for Current Month
    const date = new Date();
    // Use YYYY-MM-DD to match billing cycle logic
    const monthId = date.toISOString().split('T')[0];
    await adminDB
        .collection("workspaces")
        .doc(workspaceId)
        .collection("usage")
        .doc(monthId)
        .set({
            creditsUsed: 0,
            scraperUsed: 0,
            sequencesUsed: 0,
            templatesUsed: 0,
            smtpEmailsSent: 0,
            aiToneUsed: 0,
            resetDate: Date.now(),
            updatedAt: Date.now()
        });

    // Log analytics event
    await adminDB
      .collection("workspaces")
      .doc(workspaceId)
      .collection("events")
      .add({
        type: "subscription_activated",
        planId: newPlanId,
        subscriptionId,
        timestamp: Date.now(),
        metadata: {
          razorpayPlanId: planId,
          customerId,
        },
      });

    // Mark webhook as processed
    await adminDB
      .collection("processedWebhooks")
      .doc(eventId)
      .set({
        eventType: "subscription.activated",
        subscriptionId,
        uid,
        workspaceId,
        planId: newPlanId,
        processedAt: Date.now(),
      });

    console.log(`[Webhook] Successfully activated ${newPlanId} plan for workspace ${workspaceId}`);

  } catch (error) {
    console.error("[Webhook] Error handling subscription activation:", error);
    throw error;
  }
}

/**
 * Handle subscription cancellation event
 */
async function handleSubscriptionCancelled(subscription: any) {
  try {
    const subscriptionId = subscription.id;

    // Find user by subscription ID
    const uid = await findUserByRazorpayId("razorpaySubscriptionId", subscriptionId);
    
    if (!uid) {
      console.error(`[Webhook] User not found for cancelled subscription ${subscriptionId}`);
      return;
    }

    // Get user's current workspace
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const workspaceId = userData?.currentWorkspaceId;

    if (!workspaceId) {
      console.error(`[Webhook] No workspace found for user ${uid}`);
      return;
    }

    // Cancel workspace subscription (set to free plan)
    await cancelWorkspaceSubscription(workspaceId);

    console.log(`[Webhook] Successfully cancelled subscription for workspace ${workspaceId}`);

  } catch (error) {
    console.error("[Webhook] Error handling subscription cancellation:", error);
    throw error;
  }
}
