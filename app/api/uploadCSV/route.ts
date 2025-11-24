/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import Papa from "papaparse";
import { logEvent } from "@/lib/analytics-server";

export const runtime = "nodejs"; // ⬅️ CRITICAL FIX

export async function POST(req: Request) {
  console.log("🔥 HIT /api/uploadCSV");

  try {
    // ---------------------
    // AUTH
    // ---------------------
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      console.log("❌ Missing auth token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    console.log("✅ UID:", uid);

    // ---------------------
    // PARSE CSV
    // ---------------------
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("❌ No file received");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

    const rows = parsed.data as any[];
    console.log("📄 Parsed rows:", rows.length);

    // ---------------------
    // INSERT LEADS
    // ---------------------
    let inserted = 0;

    for (const row of rows) {
      const name = (row.name || row.Name || "").trim();
      const email = (row.email || row.Email || "").trim();

      if (!row.name?.trim() || !row.email?.trim()) {
        return NextResponse.json(
          {
            error:
              "CSV contains rows missing a required field (name or email).",
            example: { required: ["name", "email"], row },
          },
          { status: 400 }
        );
      }

      await adminDB.collection("leads").add({
        uid,
        name,
        company: row.company?.trim() || row.Company?.trim() || "",
        role: row.role?.trim() || row.Role?.trim() || "",
        email,
        website: row.website?.trim() || row.Website?.trim() || "",
        createdAt: new Date().toISOString(),
        subject: "",
        body: "",
        followUp: "",
        persona: null,
        industry: null,
      });

      inserted++;
    }

    console.log(`✅ Inserted ${inserted} / ${rows.length} leads for ${uid}`);

    // Log analytics event for lead import
    await logEvent(uid, {
      type: "lead_imported",
      meta: { count: inserted },
    });

    return NextResponse.json({ success: true, inserted });
  } catch (e) {
    console.error("❌ CSV UPLOAD ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
