import { NextResponse } from "next/server";
import { adminDB, FieldValue } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";

/**
 * Generate default workspace name from email
 * Example: "shan@gmail.com" → "Shan's Workspace"
 */
function generateWorkspaceName(email: string): string {
  const prefix = email.split("@")[0];
  const capitalized = prefix.charAt(0).toUpperCase() + prefix.slice(1);
  return `${capitalized}'s Workspace`;
}

export async function POST(req: Request) {
  try {
    const { uid, email } = await verifyUser();
    const { name } = await req.json();

    const now = Date.now();
    const workspaceRef = adminDB.collection("workspaces").doc();
    const workspaceId = workspaceRef.id;

    // Fetch free plan metadata
    const freePlanDoc = await adminDB.collection("plans").doc("free").get();
    
    if (!freePlanDoc.exists) {
      throw new Error("Free plan not found. Please run seed-plans script.");
    }

    const freePlan = freePlanDoc.data()!;

    const workspaceData = {
      workspaceName: name || generateWorkspaceName(email || "user"),
      planId: "free",
      planRef: "/plans/free",
      ownerUid: uid,
      members: [{
        uid,
        email,
        role: "owner",
        joinedAt: now
      }],
      memberIds: [uid], // For security rules
      invited: [],
      createdAt: now,
      updatedAt: now
    };

    await workspaceRef.set(workspaceData);

    // Initialize Usage for Current Month
    const date = new Date();
    const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    await workspaceRef.collection("usage").doc(monthId).set({
        creditsUsed: 0,
        scraperUsed: 0,
        sequencesUsed: 0,
        templatesUsed: 0,
        smtpEmailsSent: 0,
        aiToneUsed: 0,
        resetDate: now,
        updatedAt: now
    });

    // Update user's workspace list
    await adminDB.collection("users").doc(uid).set({
      workspaces: FieldValue.arrayUnion(workspaceId),
      currentWorkspaceId: workspaceId
    }, { merge: true });

    return NextResponse.json({ success: true, workspaceId, workspace: workspaceData });

  } catch (error: any) {
    console.error("CREATE WORKSPACE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
