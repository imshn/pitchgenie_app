/**
 * POST /api/billing/resume-subscription
 * 
 * Resumes a paused Razorpay subscription
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
        { error: "No subscription found" },
        { status: 400 }
      );
    }

    // 3. Resume subscription in Razorpay
    const subscription: any = await razorpay.subscriptions.update(
      subscriptionId,
      {
        resume_at: "now",
      } as any
    );

    // 4. Update Firestore
    await adminDB.collection("users").doc(uid).update({
      subscriptionStatus: "active",
      resumedAt: Date.now(),
      pausedAt: null,
      updatedAt: Date.now(),
    });

    // 5. Log event
    await adminDB
      .collection("users")
      .doc(uid)
      .collection("events")
      .add({
        type: "subscription_resumed",
        subscriptionId,
        timestamp: Date.now(),
      });

    console.log(`[Billing] Resumed subscription ${subscriptionId} for user ${uid}`);

    return NextResponse.json({
      success: true,
      message: "Subscription resumed successfully",
      status: subscription.status,
    });

  } catch (error: any) {
    console.error("[Billing] Resume subscription error:", error);
    
    if (error.error && error.error.description) {
      return NextResponse.json(
        { error: error.error.description },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to resume subscription" },
      { status: 500 }
    );
  }
}
