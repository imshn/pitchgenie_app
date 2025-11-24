/**
 * POST /api/billing/plan-update
 * 
 * Manually update a user's plan (for admin/dev use)
 * Does NOT interact with Razorpay - only updates Firestore
 * 
 * Auth: Requires admin role OR dev environment
 * Body: { uid: string, plan: "free" | "starter" | "pro" | "agency" }
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import { assignPlanToUser } from "@/lib/billing-utils";
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
    const callerUid = decodedToken.uid;

    // 2. Parse request body
    const body = await req.json();
    const { uid, plan } = body as { uid: string; plan: PlanType };

    if (!uid || !plan) {
      return NextResponse.json(
        { error: "Missing uid or plan" },
        { status: 400 }
      );
    }

    if (!["free", "starter", "pro", "agency"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan specified" },
        { status: 400 }
      );
    }

    // 3. Check authorization
    const callerDoc = await adminDB.collection("users").doc(callerUid).get();
    const callerData = callerDoc.data();
    const isAdmin = callerData?.isAdmin === true;
    const isDev = process.env.NODE_ENV === "development";
    const isSelf = callerUid === uid;

    // Allow if: admin, dev environment, or updating own plan
    if (!isAdmin && !isDev && !isSelf) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // 4. Verify target user exists
    const userDoc = await adminDB.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 5. Assign plan
    await assignPlanToUser(uid, plan);

    console.log(`[Plan Update] ${callerUid} updated ${uid}'s plan to ${plan}`);

    return NextResponse.json({
      success: true,
      message: `Plan updated to ${plan}`,
      uid,
      plan,
    });

  } catch (error: any) {
    console.error("[Plan Update] Error:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}
