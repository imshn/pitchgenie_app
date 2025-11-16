/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/billing/webhook/route.ts
import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    // Validate signature
    const expected = crypto.createHmac("sha256", webhookSecret).update(bodyText).digest("hex");
    if (!signature || signature !== expected) {
      console.warn("Invalid Razorpay webhook signature");
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const body = JSON.parse(bodyText);
    const event = body.event;
    const payload = body.payload || {};

    // Only handling subscription events we care about
    if (event === "subscription.activated" || event === "subscription.charged") {
      const sub = payload.subscription?.entity;
      if (!sub) return NextResponse.json({ ok: true });

      // Find user by pendingSubscriptionId OR by customer id match
      const subsId = sub.id;
      const customerId = sub.customer_id;

      // First try pendingSubscriptionId
      let userQuery = await adminDB.collection("users").where("pendingSubscriptionId", "==", subsId).get();

      if (userQuery.empty && customerId) {
        // fallback: try to find user by razorpayCustomerId
        userQuery = await adminDB.collection("users").where("razorpayCustomerId", "==", customerId).get();
      }

      if (!userQuery.empty) {
        const userDoc = userQuery.docs[0];
        const userRef = userDoc.ref;

        // Determine plan & credits from plan_id
        const planId = sub.plan_id;
        let plan = "starter";
        let credits = 600;

        if (planId === process.env.RAZORPAY_PLAN_STARTER) {
          plan = "starter";
          credits = 600;
        } else if (planId === process.env.RAZORPAY_PLAN_PRO) {
          plan = "pro";
          credits = 1500;
        } else if (planId === process.env.RAZORPAY_PLAN_AGENCY) {
          plan = "agency";
          credits = -1; // -1 meaning unlimited
        }

        const updatePayload: any = {
          plan,
          pendingSubscriptionId: null,
          stripeSubscriptionId: sub.id, // name kept same for compatibility
          activatedAt: Date.now(),
        };

        if (credits === -1) {
          updatePayload.credits = 999999999; // effectively unlimited
          updatePayload.isUnlimited = true;
        } else {
          updatePayload.credits = credits;
          updatePayload.isUnlimited = false;
        }

        await userRef.update(updatePayload);
        console.log(`Activated subscription for user ${userRef.id}, plan=${plan}`);
      } else {
        console.warn("Razorpay webhook: user not found for subscription:", subsId);
      }
    }

    if (event === "subscription.cancelled") {
      const sub = payload.subscription?.entity;
      if (sub) {
        // find user by subscription id and mark canceled (you may want to set plan->free)
        const userQuery = await adminDB.collection("users").where("stripeSubscriptionId", "==", sub.id).get();
        if (!userQuery.empty) {
          const uref = userQuery.docs[0].ref;
          await uref.update({ plan: "free", credits: 150, isUnlimited: false, canceledAt: Date.now() });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
