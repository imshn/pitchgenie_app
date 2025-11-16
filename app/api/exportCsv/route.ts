/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const uid = url.searchParams.get("uid");

    if (!token || !uid) {
      return new NextResponse("Missing auth", { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.uid !== uid) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const snap = await adminDB
      .collection("leads")
      .where("uid", "==", uid)
      .get();

    const rows: any[] = [];
    snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));

    if (rows.length === 0) {
      return new NextResponse("No leads", { status: 200 });
    }

    const keys = Object.keys(rows[0]);
    const csvHeader = keys.join(",") + "\n";

    // Use ReadableStream to stream CSV
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(csvHeader));

        for (const row of rows) {
          const line = keys
            .map((k) => {
              const v = row[k] ?? "";
              return `"${String(v).replace(/"/g, '""')}"`;
            })
            .join(",") + "\n";

          controller.enqueue(new TextEncoder().encode(line));
        }

        controller.close();
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="pitchgenie_export.csv"`,
      },
    });
  } catch (err: any) {
    console.error(err);
    return new NextResponse("Server error", { status: 500 });
  }
}
