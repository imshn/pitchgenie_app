/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import Papa from "papaparse";

export async function POST(req: Request) {
  try {
    // ---------------------
    // AUTH
    // ---------------------
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // ---------------------
    // PARSE CSV
    // ---------------------
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, { header: true });

    const rows = parsed.data as any[];

    // ---------------------
    // INSERT LEADS
    // ---------------------
    for (const row of rows) {
      if (!row.name || !row.email) continue;

      await adminDB.collection("leads").add({
        uid,
        name: row.name?.trim() || "",
        company: row.company?.trim() || "",
        role: row.role?.trim() || "",
        email: row.email?.trim() || "",     // ✅ FIXED: SAVE EMAIL
        website: row.website?.trim() || "",
        createdAt: new Date().toISOString(),

        // empty optional values
        subject: "",
        body: "",
        followUp: "",
        persona: null,
        industry: null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("CSV UPLOAD ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
