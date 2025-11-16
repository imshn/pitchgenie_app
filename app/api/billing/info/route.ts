// app/api/billing/info/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const userRef = adminDB.collection("users").doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const data = snap.data() || {};
    return NextResponse.json({
      plan: data.plan || "free",
      credits: data.credits ?? 150,
      isUnlimited: data.isUnlimited || false,
      pendingSubscriptionId: data.pendingSubscriptionId || null,
    });
  } catch (err) {
    console.error("BILLING INFO ERROR:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
