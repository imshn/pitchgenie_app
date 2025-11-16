/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

const razor = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    // ---------------- AUTH ----------------
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // ---------------- INPUT ----------------
    const { plan, contact } = await req.json();
    if (!plan) return NextResponse.json({ error: "Missing plan" }, { status: 400 });

    const planIdMap: Record<string, string | undefined> = {
      starter: process.env.RAZORPAY_PLAN_STARTER,
      pro: process.env.RAZORPAY_PLAN_PRO,
      agency: process.env.RAZORPAY_PLAN_AGENCY,
    };
    const selectedPlanId = planIdMap[plan];
    if (!selectedPlanId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    // ---------------- USER DATA ----------------
    const userRef = adminDB.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};

    const email = userData.email || decoded.email || "";
    const name = userData.fullName || decoded.name || decoded.email || "Customer";

    // ---------------- REUSE OR CREATE CUSTOMER ----------------
    let razorCustomerId: string | undefined = userData.razorpayCustomerId;
    if (!razorCustomerId) {
      // Try to find existing Razorpay customer by email
      const customers = await (razor.customers.all as any)({ email });
      if ((customers as any)?.items?.length > 0) {
        razorCustomerId = customers.items[0].id;
      } else {
        const newCustomer = await razor.customers.create({
          name,
          email,
          contact: contact || userData.contact || "",
        });
        razorCustomerId = newCustomer.id;
      }
      await userRef.update({ razorpayCustomerId: razorCustomerId });
    }

    // ---------------- CREATE SUBSCRIPTION (cast payload to any to satisfy TS) ----------------
    // Use snake_case keys (required by Razorpay runtime); cast to any so TS doesn't complain.
    const payload: any = {
      plan_id: selectedPlanId,
      customer_id: razorCustomerId,
      total_count: 12,
      customer_notify: 1,
    };

    const subscription = await (razor.subscriptions.create as any)(payload);

    // Save pending subscription id
    await userRef.update({ pendingSubscriptionId: subscription.id });
    console.log("SUBSCRIPTION:", subscription);

    return NextResponse.json({
      id: subscription.id,
      short_url: subscription.short_url || null,
      subscription,
    });
  } catch (err: any) {
    console.error("CREATE SUBSCRIPTION ERROR:", err);
    // Provide razorpay response details if present for debugging
    const status = err?.statusCode || 500;
    return NextResponse.json({ error: err?.error || err?.message || "Failed to create subscription" }, { status });
  }
}