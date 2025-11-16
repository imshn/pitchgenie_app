import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await adminAuth.verifyIdToken(token);

    const { uid, leadId, notes } = await req.json();

    if (!uid || !leadId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (uid !== decoded.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await adminDB.collection("leads").doc(leadId).update({
      notes: notes || "",
      notesUpdatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Notes update error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
