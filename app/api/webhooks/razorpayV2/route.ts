import { NextResponse } from "next/server";
import { adminDB, FieldValue, Timestamp } from "@/lib/firebase-admin";
import crypto from "crypto";

function verifyRazorpaySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

export async function POST(req: Request) {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      console.error("[Razorpay Webhook] Missing signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    );

    if (!isValid) {
      console.error("[Razorpay Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    console.log(`[Razorpay Webhook] Received event: ${event.event}`);

    // Handle order.paid event
    if (event.event === "order.paid") {
      const order = event.payload.order.entity;
      const payment = event.payload.payment.entity;

      const {
        userId,
        workspaceId,
        planId,
        billingCycle,
        planName,
      } = order.notes;

      if (!userId || !planId) {
        console.error("[Razorpay Webhook] Missing userId or planId in order notes");
        return NextResponse.json({ error: "Invalid order notes" }, { status: 400 });
      }

      console.log(
        `[Razorpay Webhook] Processing payment for user ${userId}, plan: ${planId}`
      );

      // Idempotency check - check if this order was already processed
      const eventRef = adminDB.collection("events").doc("payments").collection("transactions").doc(order.id);
      const existingEvent = await eventRef.get();

      if (existingEvent.exists) {
        console.log(`[Razorpay Webhook] Order ${order.id} already processed`);
        return NextResponse.json({ received: true, status: "already_processed" });
      }

      // Get current month for usage reset
      const now = new Date();
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

      // Update user planType
      const userRef = adminDB.collection("users").doc(userId);
      await userRef.update({
        planType: planId,
        updatedAt: FieldValue.serverTimestamp()
      });

      console.log(`[Razorpay Webhook] Updated user planType to ${planId}`);

      // Reset usage for current month
      const usageRef = userRef.collection("usage").doc(currentMonth);
      await usageRef.set(
        {
          monthId: currentMonth,
          creditsUsed: 0,
          lightScrapesUsed: 0,
          deepScrapesUsed: 0, sequencesUsed: 0,
          templatesUsed: 0,
          smtpEmailsSent: 0,
          aiGenerations: 0,
          imapSyncCount: 0,
          resetDate: Timestamp.fromDate(
            new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
          ),
          updatedAt: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      console.log(`[Razorpay Webhook] Reset usage for month ${currentMonth}`);

      // If workspace billing, update workspace planId
      if (workspaceId) {
        const workspaceRef = adminDB.collection("workspaces").doc(workspaceId);
        await workspaceRef.update({
          planId,
          updatedAt: FieldValue.serverTimestamp()
        });

        // Reset workspace usage
        const workspaceUsageRef = workspaceRef.collection("usage").doc(currentMonth);
        await workspaceUsageRef.set(
          {
            monthId: currentMonth,
            creditsUsed: 0,
            lightScrapesUsed: 0,
            deepScrapesUsed: 0,
            sequencesUsed: 0,
            templatesUsed: 0,
            smtpEmailsSent: 0,
            aiGenerations: 0,
            imapSyncCount: 0,
            resetDate: Timestamp.fromDate(
              new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
            ),
            updatedAt: FieldValue.serverTimestamp()
          },
          { merge: true }
        );

        console.log(`[Razorpay Webhook] Updated workspace ${workspaceId} planId to ${planId}`);
      }

      // Log event
      await eventRef.set({
        id: order.id,
        userId,
        workspaceId: workspaceId || null,
        planId,
        planName,
        billingCycle,
        amount: payment.amount / 100, // Convert paise to rupees
        currency: payment.currency,
        status: "success",
        razorpayOrderId: order.id,
        razorpayPaymentId: payment.id,
        createdAt: FieldValue.serverTimestamp()
      });

      console.log(`[Razorpay Webhook] Logged payment event for order ${order.id}`);

      // Log analytics event
      try {
        await adminDB
          .collection("users")
          .doc(userId)
          .collection("events")
          .add({
            type: "plan_purchased",
            planId,
            planName,
            amount: payment.amount / 100,
            billingCycle,
            createdAt: FieldValue.serverTimestamp()
          });
      } catch (analyticsError) {
        console.error("[Razorpay Webhook] Failed to log analytics:", analyticsError);
        // Don't fail the webhook for analytics errors
      }

      console.log(`[Razorpay Webhook] Successfully processed payment for user ${userId}`);

      return NextResponse.json({ received: true, status: "processed" });
    }

    // For other events, just acknowledge
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("[Razorpay Webhook] Error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
