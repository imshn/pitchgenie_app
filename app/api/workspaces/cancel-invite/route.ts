import { NextResponse } from "next/server";
import { adminDB, FieldValue } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { workspaceId, email } = await req.json();

    if (!workspaceId || !email) {
      return NextResponse.json(
        { error: "Workspace ID and email are required" },
        { status: 400 }
      );
    }

    // Verify workspace exists
    const workspaceRef = adminDB.collection("workspaces").doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();

    if (!workspaceDoc.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const workspaceData = workspaceDoc.data();

    // Verify requester is owner or admin
    const requester = workspaceData?.members?.find((m: any) => m.uid === uid);
    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if email is in invited list
    if (!workspaceData?.invited?.includes(email)) {
      return NextResponse.json({ error: "No invitation found for this email" }, { status: 404 });
    }

    // Remove from invited list
    await workspaceRef.update({
      invited: FieldValue.arrayRemove(email),
    });

    // Delete notification if user exists
    const userQuery = await adminDB.collection("users").where("email", "==", email).limit(1).get();

    if (!userQuery.empty) {
      const inviteeUid = userQuery.docs[0].id;
      
      // Find and delete the notification
      const notificationsQuery = await adminDB
        .collection("users")
        .doc(inviteeUid)
        .collection("notifications")
        .where("type", "==", "workspace_invite")
        .where("workspaceId", "==", workspaceId)
        .get();

      const batch = adminDB.batch();
      notificationsQuery.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("CANCEL INVITE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
