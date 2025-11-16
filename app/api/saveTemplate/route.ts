import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    // ---------------------------
    // VERIFY AUTH
    // ---------------------------
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        { error: "Missing auth token" },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // ---------------------------
    // REQUEST BODY
    // ---------------------------
    const { title, subject, body, followUp } = await req.json();

    if (!title || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ---------------------------
    // SAVE TEMPLATE TO FIRESTORE
    // ---------------------------
    await adminDB
      .collection("users")
      .doc(uid)
      .collection("templates")
      .add({
        title,
        subject,
        body,
        followUp: followUp || "",
        createdAt: Date.now(),
      });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("SAVE TEMPLATE ERROR:", e);
    return NextResponse.json(
      { error: "Server Error saving template" },
      { status: 500 }
    );
  }
}
