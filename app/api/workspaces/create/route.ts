import { NextResponse } from "next/server";
import { adminDB, FieldValue } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";

export async function POST(req: Request) {
  try {
    const { uid, email } = await verifyUser();
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    const now = Date.now();
    const workspaceRef = adminDB.collection("workspaces").doc();
    const workspaceId = workspaceRef.id;

    const workspaceData = {
      ownerUid: uid,
      name: name || "My Workspace",
      plan: "free",
      credits: 50,
      maxCredits: 50,
      members: [{
        uid,
        email,
        role: "owner",
        joinedAt: Date.now()
      }],
      memberIds: [uid], // For security rules
      invited: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await workspaceRef.set(workspaceData);

    // Update user's workspace list
    await adminDB.collection("users").doc(uid).set({
      workspaces: FieldValue.arrayUnion(workspaceId),
      currentWorkspaceId: workspaceId // Switch to new workspace immediately? Or let UI decide?
    }, { merge: true });

    return NextResponse.json({ success: true, workspaceId, workspace: workspaceData });

  } catch (error: any) {
    console.error("CREATE WORKSPACE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
