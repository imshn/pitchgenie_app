import { NextResponse } from "next/server";
import { adminDB, FieldValue } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { workspaceId, memberUid } = await req.json();

    if (!workspaceId || !memberUid) {
      return NextResponse.json({ error: "Workspace ID and member UID are required" }, { status: 400 });
    }

    // Verify workspace exists
    const workspaceRef = adminDB.collection("workspaces").doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();

    if (!workspaceDoc.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const workspaceData = workspaceDoc.data();
    
    // Verify requester is owner
    const requester = workspaceData?.members.find((m: any) => m.uid === uid);
    if (!requester || requester.role !== "owner") {
      // Allow users to leave (remove themselves)
      if (uid !== memberUid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Cannot remove the owner (unless transferring ownership - out of scope for now)
    const targetMember = workspaceData?.members.find((m: any) => m.uid === memberUid);
    if (targetMember?.role === "owner" && uid !== memberUid) {
      return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 });
    }

    // Remove from members array
    const updatedMembers = workspaceData?.members.filter((m: any) => m.uid !== memberUid);

    await workspaceRef.update({
      members: updatedMembers,
      memberIds: FieldValue.arrayRemove(memberUid) // For security rules
    });

    // Remove workspace from user's list
    await adminDB.collection("users").doc(memberUid).update({
      workspaces: FieldValue.arrayRemove(workspaceId),
      // If currentWorkspaceId was this one, we should probably unset it or switch to another.
      // For simplicity, we'll let the frontend handle the redirect if the user is currently in this workspace.
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("REMOVE MEMBER ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
