
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import { razorpay } from "@/lib/razorpay";

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
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    // 3. Fetch plan from Firestore
    const planDoc = await adminDB.collection("plans").doc(planId).get();
    if (!planDoc.exists) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const planData = planDoc.data();
    const priceMonthly = planData?.priceMonthly || 0;

    if (priceMonthly <= 0) {
      return NextResponse.json({ error: "Invalid plan price" }, { status: 400 });
    }

    // 4. Create Razorpay Order
    const amountInPaise = priceMonthly * 100;
    const currency = "INR";

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: `receipt_${uid}_${Date.now()}`,
      notes: {
        uid,
        planId,
        type: "subscription_purchase" // Custom note to identify this in webhook
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
