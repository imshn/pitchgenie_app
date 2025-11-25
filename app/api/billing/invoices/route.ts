/**
 * GET /api/billing/invoices
 * 
 * Lists user's invoices
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import { razorpay } from "@/lib/razorpay";

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

    // 2. Get user's Razorpay customer ID
    const userDoc = await adminDB.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const customerId = userData?.razorpayCustomerId;

    if (!customerId) {
      return NextResponse.json({ invoices: [] });
    }

    // 3. Fetch invoices from Razorpay
    // We cast to any because the razorpay-node types might be incomplete for invoices.all
    const response: any = await razorpay.invoices.all({
      customer_id: customerId,
      count: 20,
    } as any);

    const invoices = response.items.map((invoice: any) => ({
      id: invoice.id,
      amount: invoice.amount / 100, // Convert paise to rupees
      currency: invoice.currency,
      status: invoice.status,
      date: invoice.created_at * 1000, // Convert seconds to ms
      pdfUrl: invoice.short_url,
      description: invoice.description || "Subscription Payment",
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
