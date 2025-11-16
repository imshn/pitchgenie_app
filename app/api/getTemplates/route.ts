import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = await adminAuth.verifyIdToken(token);

    const snap = await adminDB
      .collection("users")
      .doc(decoded.uid)
      .collection("templates")
      .orderBy("createdAt", "desc")
      .get();

    const templates = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Get Templates Error:", error);
    return NextResponse.json(
      { error: "Error fetching templates" },
      { status: 500 }
    );
  }
}
