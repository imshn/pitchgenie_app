import { NextResponse } from "next/server";
import { adminAuth, adminDB, FieldValue } from "@/lib/firebase-admin";
import { logEvent } from "@/lib/analytics-server";
import { getUserPlan } from "@/lib/server/getUserPlan";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { cost, actionType, metadata } = await req.json();
    if (typeof cost !== "number" || cost <= 0) return NextResponse.json({ error: "Invalid cost" }, { status: 400 });

    // 1. Get Effective Plan & Limits
    const { remaining, workspaceId, planData } = await getUserPlan(uid);

    if (!workspaceId) {
        return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    // 2. Check Limits
    if (remaining.credits < cost) {
        return NextResponse.json({ error: "Insufficient credits", remaining: remaining.credits }, { status: 402 });
    }

    const workspaceRef = adminDB.collection("workspaces").doc(workspaceId);
    const date = new Date();
    // FIX: Use YYYY-MM-DD for usage document ID to match server logic
    const dateId = date.toISOString().split('T')[0];
    const usageRef = workspaceRef.collection("usage").doc(dateId);

    // 3. Atomic Update
    await adminDB.runTransaction(async (tx) => {
      // Re-read usage inside transaction for safety (optional but good for high concurrency)
      // For now, we trust the getUserPlan check + atomic increment
      
      tx.set(usageRef, {
          creditsUsed: FieldValue.increment(cost),
          updatedAt: Date.now()
      }, { merge: true });
      
      // Log detailed usage event
      const logRef = workspaceRef.collection("usage_logs").doc();
      tx.set(logRef, {
          uid,
          cost,
          actionType: actionType || "unknown",
          metadata: metadata || {},
          timestamp: Date.now()
      });
    });

    // Log analytics event
    await logEvent(uid, {
      type: "credits_deducted",
      cost,
      workspaceId,
      meta: {
        plan: planData.name
      }
    });

    return NextResponse.json({ success: true, remaining: remaining.credits - cost });
  } catch (err: unknown) {
    console.error("CREDITS USE ERROR:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to deduct credits";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
