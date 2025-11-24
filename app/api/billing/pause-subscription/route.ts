/**
 * POST /api/billing/pause-subscription
 * 
 * Pauses an active Razorpay subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import { razorpay } from "@/lib/razorpay";

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

    // 2. Get user's subscription ID
    const userDoc = await adminDB.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const subscriptionId = userData?.razorpaySubscriptionId;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // 3. Pause subscription in Razorpay
    const subscription: any = await razorpay.subscriptions.update(
      subscriptionId,
      {
        pause_at: "now",
      } as any
    );

    // 4. Update Firestore
    await adminDB.collection("users").doc(uid).update({
      subscriptionStatus: "paused",
      pausedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 5. Log event
    await adminDB
      .collection("users")
      .doc(uid)
      .collection("events")
      .add({
        type: "subscription_paused",
        subscriptionId,
        timestamp: Date.now(),
      });

    console.log(`[Billing] Paused subscription ${subscriptionId} for user ${uid}`);

    return NextResponse.json({
      success: true,
      message: "Subscription paused successfully",
      status: subscription.status,
    });

  } catch (error: any) {
    console.error("[Billing] Pause subscription error:", error);
    
    if (error.error && error.error.description) {
      return NextResponse.json(
        { error: error.error.description },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to pause subscription" },
      { status: 500 }
    );
  }
}
