import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";

export async function GET(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    // Verify workspace exists
    const workspaceDoc = await adminDB.collection("workspaces").doc(workspaceId).get();

    if (!workspaceDoc.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const workspaceData = workspaceDoc.data();
    
    // Verify requester is a member
    const isMember = workspaceData?.members.some((m: any) => m.uid === uid);
    if (!isMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const members = (workspaceData?.members || []).map((m: any) => ({
      ...m,
      joinedAt: m.joinedAt?.toDate ? m.joinedAt.toDate().toISOString() : m.joinedAt,
    }));

    const invited = (workspaceData?.invited || []).map((i: any) => {
        if (typeof i === 'string') {
            return { email: i, invitedAt: null };
        }
        return {
            ...i,
            invitedAt: i.invitedAt?.toDate ? i.invitedAt.toDate().toISOString() : i.invitedAt,
        };
    });

    return NextResponse.json({ 
      members,
      invited
    });

  } catch (error: any) {
    console.error("GET MEMBERS ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
