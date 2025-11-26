import { NextResponse } from "next/server";
import { adminDB, FieldValue } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";

export async function POST(req: Request) {
  try {
    const { uid, email } = await verifyUser();
    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // Verify workspace exists
    const workspaceRef = adminDB.collection("workspaces").doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();

    if (!workspaceDoc.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const workspaceData = workspaceDoc.data();

    // Check if user is a member
    const member = workspaceData?.members?.find((m: any) => m.uid === uid);
    if (!member) {
      return NextResponse.json({ error: "You are not a member of this workspace" }, { status: 403 });
    }

    // Prevent owner from leaving
    if (member.role === "owner") {
      return NextResponse.json(
        { error: "Workspace owner cannot leave. Please transfer ownership first." },
        { status: 403 }
      );
    }

    // Remove user from workspace
    await workspaceRef.update({
      members: FieldValue.arrayRemove(member),
      memberIds: FieldValue.arrayRemove(uid),
    });

    // Get user document to update workspaces list
    const userRef = adminDB.collection("users").doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    const updateData: any = {
      workspaces: FieldValue.arrayRemove(workspaceId),
    };

    // If this was the current workspace, switch to another one or null
    if (userData?.currentWorkspaceId === workspaceId) {
      const remainingWorkspaces = userData?.workspaces?.filter((id: string) => id !== workspaceId) || [];
      updateData.currentWorkspaceId = remainingWorkspaces.length > 0 ? remainingWorkspaces[0] : null;
    }

    await userRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: "Successfully left the workspace",
      newCurrentWorkspaceId: updateData.currentWorkspaceId,
    });

  } catch (error: any) {
    console.error("LEAVE WORKSPACE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
