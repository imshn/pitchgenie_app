import { NextResponse } from "next/server";
import { adminDB, FieldValue } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";

export async function POST(req: Request) {
  try {
    const { uid, email } = await verifyUser();
    
    const { workspaceId } = await req.json().catch(() => ({}));

    console.log("Accepting invite for:", email, "Workspace:", workspaceId);

    let workspacesSnap;

    if (workspaceId) {
        // Direct fetch for specific workspace
        const docSnap = await adminDB.collection("workspaces").doc(workspaceId).get();
        if (docSnap.exists && docSnap.data()?.invited?.includes(email)) {
            workspacesSnap = { empty: false, docs: [docSnap] };
        } else {
            console.log("Workspace not found or user not invited");
            workspacesSnap = { empty: true, docs: [] };
        }
    } else {
        // Find all workspaces where this email is invited
        const query = adminDB.collection("workspaces").where("invited", "array-contains", email);
        workspacesSnap = await query.get();
    }

    if (workspacesSnap.empty) {
      return NextResponse.json({ message: "No pending invitations found" });
    }

    const batch = adminDB.batch();
    const joinedWorkspaces = [];

    for (const doc of workspacesSnap.docs) {
      const workspaceId = doc.id;
      const workspaceRef = doc.ref;

      // Add to members, remove from invited, add to memberIds
      batch.update(workspaceRef, {
        members: FieldValue.arrayUnion({
          uid,
          email,
          role: "member", // Default role
          joinedAt: Date.now()
        }),
        memberIds: FieldValue.arrayUnion(uid), // For security rules
        invited: FieldValue.arrayRemove(email)
      });

      // Add workspace to user's list
      const userRef = adminDB.collection("users").doc(uid);
      batch.set(userRef, {
        workspaces: FieldValue.arrayUnion(workspaceId),
        // If user has no current workspace, set this one
        // We can't conditionally set in a batch easily without reading first, 
        // but we can handle that client-side or in a separate check.
      }, { merge: true });

      joinedWorkspaces.push(workspaceId);
    }

    await batch.commit();

    return NextResponse.json({ success: true, joined: joinedWorkspaces });

  } catch (error: any) {
    console.error("ACCEPT INVITE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
