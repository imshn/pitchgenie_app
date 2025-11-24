/**
 * POST /api/billing/create-subscription
 * 
 * Creates a Razorpay subscription for the authenticated user
 * Uses the shared razorpay client and billing utilities
 * 
 * Body: { plan: "starter" | "pro" | "agency", contact?: string }
 * Returns: { subscriptionId, shortUrl }
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import { razorpay, RAZORPAY_PLANS } from "@/lib/razorpay";
import { getOrCreateRazorpayCustomer } from "@/lib/billing-utils";
import type { PlanType } from "@/lib/credit-types";

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

    // 2. Parse request body
    const body = await req.json();
    const { plan, contact } = body as { plan: PlanType; contact?: string };

    if (!plan || !["starter", "pro", "agency"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan specified" },
        { status: 400 }
      );
    }

    // 3. Get user data
    const userDoc = await adminDB.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const email = userData?.email || decodedToken.email;
    const name = userData?.name || decodedToken.name;

    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // 4. Check if plan ID is configured
    if (plan === "free") {
      return NextResponse.json(
        { error: "Cannot create subscription for free plan" },
        { status: 400 }
      );
    }
    
    const planId = RAZORPAY_PLANS[plan as keyof typeof RAZORPAY_PLANS];
    if (!planId) {
      return NextResponse.json(
        { error: `Razorpay plan ID not configured for ${plan}. Please add RAZORPAY_PLAN_${plan.toUpperCase()} to environment variables.` },
        { status: 500 }
      );
    }

    // 5. Create or get Razorpay customer
    const customerId = await getOrCreateRazorpayCustomer(
      razorpay,
      uid,
      email,
      name
    );

    // 6. Create subscription (cast to any to bypass strict type checking)
    const subscription: any = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      total_count: 12, // 12 monthly cycles
      quantity: 1,
      customer_notify: 1,
      notes: {
        uid,
        plan,
        email,
      },
    } as any);

    console.log(`[Billing] Created subscription ${subscription.id} for user ${uid}`);

    // 7. Save pending subscription ID
    await adminDB.collection("users").doc(uid).update({
      pendingSubscriptionId: subscription.id,
      updatedAt: Date.now(),
    });

    // 8. Return subscription details
    return NextResponse.json({
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
      status: subscription.status,
    });

  } catch (error: any) {
    console.error("[Billing] Create subscription error:", error);
    
    // Handle Razorpay specific errors
    if (error.error && error.error.description) {
      return NextResponse.json(
        { error: error.error.description },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}