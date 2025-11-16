/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/credits/use/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { cost } = await req.json();
    if (typeof cost !== "number" || cost <= 0) return NextResponse.json({ error: "Invalid cost" }, { status: 400 });

    const userRef = adminDB.collection("users").doc(uid);

    // Atomic transaction to prevent race conditions
    await adminDB.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error("User not found");

      const user = snap.data() as any;
      if (user.plan === "agency" || user.isUnlimited) {
        // do nothing for unlimited
        return;
      }

      const current = user.credits ?? 0;
      if (current < cost) {
        throw new Error("INSUFFICIENT_CREDITS");
      }

      tx.update(userRef, { credits: current - cost });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("CREDITS USE ERROR:", err);
    if (err.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
    }
    return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 });
  }
}
