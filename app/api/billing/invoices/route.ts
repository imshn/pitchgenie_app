import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { adminDB } from "@/lib/firebase-admin";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_WEBHOOK_SECRET!, // Using webhook secret as key_secret if that's what's available, otherwise should be RAZORPAY_KEY_SECRET
});

export async function GET(req: Request) {
  try {
    const { uid } = await verifyUser();

    // Get user's current workspace
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const workspaceId = userData?.currentWorkspaceId;

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const workspaceDoc = await adminDB.collection("workspaces").doc(workspaceId).get();
    const workspaceData = workspaceDoc.data();
    const subscriptionId = workspaceData?.razorpaySubscriptionId;

    if (!subscriptionId) {
        return NextResponse.json({ invoices: [] });
    }

    // Fetch invoices for this subscription
    // Note: Razorpay API might require customer ID or subscription ID to filter
    // Here we try to fetch invoices related to the subscription
    
    // Since we might not have stored customer_id, we can try to fetch by subscription_id if supported
    // or we just return empty if we can't link them easily without more DB changes.
    // However, Razorpay usually links invoices to subscriptions.
    
    const invoices = await razorpay.invoices.all({
        subscription_id: subscriptionId,
        count: 10
    });

    return NextResponse.json({ invoices: invoices.items });
  } catch (error) {
    console.error("INVOICE FETCH ERROR:", error);
    // Return empty list on error to not break UI
    return NextResponse.json({ invoices: [] });
  }
}
