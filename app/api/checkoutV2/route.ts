import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { adminDB } from "@/lib/firebase-admin";
import { PlanDocument } from "@/lib/types/plans";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { uid, email } = await verifyUser();
    const { planId, billingCycle } = await req.json();

    // Validate input
    if (!planId || !billingCycle) {
      return NextResponse.json(
        { error: "planId and billingCycle are required" },
        { status: 400 }
      );
    }

    if (!["monthly", "yearly"].includes(billingCycle)) {
      return NextResponse.json(
        { error: "billingCycle must be 'monthly' or 'yearly'" },
        { status: 400 }
      );
    }

    if (!["starter", "pro", "agency"].includes(planId)) {
      return NextResponse.json(
        { error: "Invalid planId. Must be starter, pro, or agency" },
        { status: 400 }
      );
    }

    // Fetch plan from Firestore
    const planDoc = await adminDB.collection("plans").doc(planId).get();

    if (!planDoc.exists) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const plan = planDoc.data() as PlanDocument;

    // Get price based on billing cycle
    const amount =
      billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;

    if (amount === 0) {
      return NextResponse.json(
        { error: "Cannot create order for free plan" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects paise
      currency: "INR",
      receipt: `order_${uid}_${Date.now()}`,
      notes: {
        userId: uid,
        email: email as string,
        planId,
        billingCycle,
        planName: plan.name,
      },
    });

    console.log(`[POST /api/checkoutV2] Order created for user ${uid}:`, order.id);

    return NextResponse.json({
      orderId: order.id,
      amount,
     currency: "INR",
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      planName: plan.name,
    });
  } catch (error: any) {
    console.error("[POST /api/checkoutV2] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout" },
      { status: 500 }
    );
  }
}
