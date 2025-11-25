/**
 * POST /api/onboarding/skip-profile
 * 
 * Skips profile setup, moves to billing step
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

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

    // 2. Update onboarding step to 3 (billing)
    await adminDB.collection("users").doc(uid).update({
      onboardingStep: 3,
      updatedAt: Date.now(),
    });

    console.log(`[Onboarding] User ${uid} skipped profile setup`);

    return NextResponse.json({ success: true, nextStep: 3 });

  } catch (error: any) {
    console.error("[Onboarding] Skip profile error:", error);
    return NextResponse.json(
      { error: "Failed to skip profile" },
      { status: 500 }
    );
  }
}
