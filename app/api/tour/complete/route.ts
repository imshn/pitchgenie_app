/**
 * POST /api/tour/complete
 * 
 * Marks the product tour as completed for the current user
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

    // 2. Update user document
    const now = Date.now();
    await adminDB.collection("users").doc(uid).update({
      firstTimeTourCompleted: true,
      updatedAt: now,
    });

    // 3. Log tour completion event
    await adminDB
      .collection("users")
      .doc(uid)
      .collection("events")
      .add({
        type: "tour_completed",
        timestamp: now,
      });

    console.log(`[Tour] User ${uid} completed product tour`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Tour] Complete error:", error);
    return NextResponse.json(
      { error: "Failed to complete tour" },
      { status: 500 }
    );
  }
}
