import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "").trim();
    const decoded = await adminAuth.verifyIdToken(token);

    const { type, leadId, value } = await req.json();

    // Write event
    await adminDB
      .collection("users")
      .doc(decoded.uid)
      .collection("events")
      .add({
        type,
        leadId: leadId || null,
        value: value || null,
        timestamp: Date.now(),
      });

    // Update summary counters
    const summaryRef = adminDB
      .collection("users")
      .doc(decoded.uid)
      .collection("analytics")
      .doc("summary");

    await summaryRef.set(
      {
        [type]: admin.firestore.FieldValue.increment(1),
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    // If deliverability => update average
    if (type === "deliverability") {
      await summaryRef.set(
        {
          deliverabilityScores: admin.firestore.FieldValue.arrayUnion(value || 0),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Analytics event error", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
