/**
 * GET /api/billing/invoices
 * 
 * Lists user's invoices
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

    // 2. Fetch invoices from Firestore
    const snapshot = await adminDB
      .collection("invoices")
      .where("uid", "==", uid)
      .orderBy("issueDate", "desc")
      .limit(50)
      .get();

    const invoices = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ invoices });

  } catch (error: any) {
    console.error("[Billing] Get invoices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
