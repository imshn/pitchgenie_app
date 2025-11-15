/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/createTemplate/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin"; // adjust path if needed

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    const decoded = await adminAuth.verifyIdToken(token);

    const { uid, title, prompt, type } = await req.json();

    if (!uid || !title || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (uid !== decoded.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = {
      uid,
      title,
      prompt,
      type: type || "email",
      createdAt: new Date().toISOString(),
    };

    const ref = await adminDB.collection("templates").add(data);

    return NextResponse.json({ id: ref.id, ...data });
  } catch (error: any) {
    console.error("Template save error:", error);
    return NextResponse.json({ error: "Internal server error", detail: error.message }, { status: 500 });
  }
}
