import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import { PlanId } from "@/types/billing";

export async function POST(req: Request) {
  try {
    // Verify Firebase token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);
    const requestingUid = decoded.uid;

    // Parse request body
    const body = await req.json();
    const { uid, plan } = body as { uid: string; plan: PlanId };

    if (!uid || !plan) {
      return NextResponse.json(
        { error: "Missing uid or plan" },
        { status: 400 }
      );
    }

    // Validate plan type
    const validPlans: PlanId[] = ["free", "starter", "pro", "agency"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      );
    }

    // For now, allow users to update their own plan
    // Later, this can be restricted to admin or triggered by payment webhooks
    // TODO: Add Razorpay payment verification here
    if (requestingUid !== uid) {
      // In production, check if requesting user is admin
      // For now, allow self-updates for testing
      console.warn("[Plan Update] Cross-user plan update attempted");
    }

    // Update the plan
    try {
        await adminDB.collection("workspaces").doc(uid).update({
            planId: plan,
            updatedAt: Date.now(),
        });
    } catch (err: unknown) {
        console.error("Plan update failed:", err);
        return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Plan updated to ${plan}`,
    });
  } catch (error) {
    console.error("[Plan Update API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
