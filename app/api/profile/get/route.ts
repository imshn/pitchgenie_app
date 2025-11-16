import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const ref = adminDB
      .collection("users")
      .doc(uid)
      .collection("profile")
      .doc("main");

    const snap = await ref.get();

    return NextResponse.json({ profile: snap.exists ? snap.data() : null });
  } catch (err) {
    console.error("PROFILE GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
