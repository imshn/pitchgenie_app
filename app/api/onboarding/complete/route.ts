/**
 * POST /api/onboarding/complete
 * 
 * Marks onboarding as complete
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import { PLAN_CONFIGS } from "@/lib/credit-types";

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

    // 2. Parse request body for plan selection
    const body = await req.json();
    const { plan = "free" } = body;

    // 3. Get plan config
    const planConfig = PLAN_CONFIGS[plan as keyof typeof PLAN_CONFIGS] || PLAN_CONFIGS.free;
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    // 4. Update user document
    await adminDB.collection("users").doc(uid).update({
      onboardingCompleted: true,
      onboardingStep: 4,
      plan,
      credits: planConfig.credits,
      maxCredits: planConfig.maxCredits,
      monthlyCredits: planConfig.monthlyCredits,
      scraperLimit: planConfig.scraperLimit,
      scraperUsed: 0,
      isUnlimited: plan === "agency",
      nextReset: now + thirtyDays,
      updatedAt: now,
    });

    // 5. Log event
    await adminDB
      .collection("users")
      .doc(uid)
      .collection("events")
      .add({
        type: "onboarding_completed",
        plan,
        timestamp: now,
      });

    console.log(`[Onboarding] User ${uid} completed onboarding with ${plan} plan`);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[Onboarding] Complete error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
