import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";

export async function POST(req: Request) {
  try {
    const { uid, workspaceId } = await verifyUser();
    const { leadId, notes } = await req.json();

    if (!leadId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
    }

    await adminDB.collection("workspaces").doc(workspaceId).collection("leads").doc(leadId).update({
      notes: notes || "",
      notesUpdatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Notes update error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
