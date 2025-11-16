/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);

    const ref = adminDB
      .collection("users")
      .doc(decoded.uid)
      .collection("analytics")
      .doc("summary");

    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({
        sent: 0,
        opens: 0,
        clicks: 0,
        replies: 0,
        deliverability: 0,
      });
    }

    const data = snap.data();

    let avg = 0;
    if (data?.deliverabilityScores?.length) {
      const total = data?.deliverabilityScores.reduce((a: any, b: any) => a + b, 0);
      avg = Math.round(total / data?.deliverabilityScores.length);
    }

    return NextResponse.json({
      sent: data?.sent || 0,
      opens: data?.opens || 0,
      clicks: data?.clicks || 0,
      replies: data?.replies || 0,
      deliverability: avg,
    });
  } catch (e) {
    console.error("summary error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
