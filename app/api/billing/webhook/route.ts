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
  assignPlanToUser,
  mapPlanIdToPlanName,
  findUserByRazorpayId,
  cancelUserSubscription,
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

    // Map plan ID to plan name
    const plan = mapPlanIdToPlanName(planId);
    if (!plan) {
      console.error(`[Webhook] Unknown plan ID: ${planId}`);
      return;
    }

    // Assign plan and credits to user
    await assignPlanToUser(uid, plan, subscriptionId);

    // Log analytics event
    await adminDB
      .collection("users")
      .doc(uid)
      .collection("events")
      .add({
        type: "subscription_activated",
        plan,
        subscriptionId,
        timestamp: Date.now(),
        metadata: {
          planId,
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
        plan,
        processedAt: Date.now(),
      });

    console.log(`[Webhook] Successfully activated ${plan} plan for user ${uid}`);

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

    // Cancel user subscription (set to free plan)
    await cancelUserSubscription(uid);

    console.log(`[Webhook] Successfully cancelled subscription for user ${uid}`);

  } catch (error) {
    console.error("[Webhook] Error handling subscription cancellation:", error);
    throw error;
  }
}
