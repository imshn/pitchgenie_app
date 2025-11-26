import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { adminDB } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { smtpConfig } = await req.json();

    // Get user's current workspace
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const workspaceId = userData?.currentWorkspaceId;

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    // Check if user is owner or admin of workspace
    const workspaceDoc = await adminDB.collection("workspaces").doc(workspaceId).get();
    const workspaceData = workspaceDoc.data();

    if (workspaceData?.ownerUid !== uid && !workspaceData?.memberIds?.includes(uid)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Save SMTP config to workspace settings
    // Storing in a subcollection to keep main doc clean and secure
    await adminDB
      .collection("workspaces")
      .doc(workspaceId)
      .collection("settings")
      .doc("smtp")
      .set({
        ...smtpConfig,
        updatedAt: Date.now(),
        updatedBy: uid,
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SMTP CONFIG ERROR:", error);
    return NextResponse.json({ error: "Failed to save SMTP config" }, { status: 500 });
  }
}
