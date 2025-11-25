import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";

export async function POST(req: Request) {
  try {
    const { uid, workspaceId } = await verifyUser();
    const { leadId, status } = await req.json();

    if (!leadId || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
    }

    await adminDB.collection("workspaces").doc(workspaceId).collection("leads").doc(leadId).update({
      status,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
