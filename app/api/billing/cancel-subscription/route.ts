/**
 * POST /api/billing/cancel-subscription
 * 
 * Cancels a Razorpay subscription (immediate cancellation)
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import { razorpay } from "@/lib/razorpay";
import { cancelWorkspaceSubscription } from "@/lib/billing-utils";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Firebase token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Get user's workspace
    const userDoc = await adminDB.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const workspaceId = userData?.currentWorkspaceId;
    const subscriptionId = userData?.razorpaySubscriptionId; // Still on user for now? Or workspace? 
    // Assuming subscription is on workspace now based on billing-utils logic, but let's check where it's stored.
    // In billing-utils, assignPlanToWorkspace updates workspace with subscriptionId.
    // So we should look at workspace for subscriptionId.
    
    if (!workspaceId) {
         return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const workspaceDoc = await adminDB.collection("workspaces").doc(workspaceId).get();
    const workspaceData = workspaceDoc.data();
    const workspaceSubscriptionId = workspaceData?.razorpaySubscriptionId;

    if (!workspaceSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found for this workspace" },
        { status: 400 }
      );
    }

    // 3. Cancel subscription in Razorpay
    const subscription: any = await razorpay.subscriptions.cancel(
      workspaceSubscriptionId,
      true // cancel_at_cycle_end = true (don't cancel immediately)
    );

    // 4. Cancel in Firestore (use utility function)
    await cancelWorkspaceSubscription(workspaceId);

    console.log(`[Billing] Cancelled subscription ${workspaceSubscriptionId} for workspace ${workspaceId}`);

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully. You'll retain access until the end of your billing period.",
      status: subscription.status,
    });

  } catch (error: any) {
    console.error("[Billing] Cancel subscription error:", error);
    
    if (error.error && error.error.description) {
      return NextResponse.json(
        { error: error.error.description },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
