/**
 * GET /api/billing/admin/users
 * 
 * Lists users with billing information for debugging
 * 
 * Auth: Requires isAdmin flag on user document
 * Query params: ?limit=50
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
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

    // 2. Check admin permission
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const userData = userDoc.data();

    if (!userData?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required. Set isAdmin: true in your user document." },
        { status: 403 }
      );
    }

    // 3. Get query params
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    // 4. Fetch users with billing info
    const snapshot = await adminDB
      .collection("users")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || null,
        name: data.name || null,
        plan: data.plan || "free",
        credits: data.credits || 0,
        maxCredits: data.maxCredits || 0,
        isUnlimited: data.isUnlimited || false,
        razorpayCustomerId: data.razorpayCustomerId || null,
        razorpaySubscriptionId: data.razorpaySubscriptionId || null,
        pendingSubscriptionId: data.pendingSubscriptionId || null,
        activatedAt: data.activatedAt || null,
        canceledAt: data.canceledAt || null,
        nextReset: data.nextReset || null,
        createdAt: data.createdAt || null,
      };
    });

    return NextResponse.json({
      users,
      count: users.length,
      limit,
    });

  } catch (error: any) {
    console.error("[Admin] Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
