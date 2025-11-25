import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // Verify user is a member of the target workspace
    const workspaceDoc = await adminDB.collection("workspaces").doc(workspaceId).get();
    
    if (!workspaceDoc.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const workspaceData = workspaceDoc.data();
    const isMember = workspaceData?.members.some((m: any) => m.uid === uid);

    if (!isMember) {
      return NextResponse.json({ error: "You are not a member of this workspace" }, { status: 403 });
    }

    // Update user's current workspace
    await adminDB.collection("users").doc(uid).update({
      currentWorkspaceId: workspaceId
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("SWITCH WORKSPACE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
