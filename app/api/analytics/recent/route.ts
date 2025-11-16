import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);

    const snap = await adminDB
      .collection("users")
      .doc(decoded.uid)
      .collection("events")
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ events });
  } catch (e) {
    console.error("recent events error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
