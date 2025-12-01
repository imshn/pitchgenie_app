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

    // Plan Check - REMOVED to allow SMTP for Free plan
    // const { getUserPlan } = await import("@/lib/server/getUserPlan");
    // const planData = await getUserPlan(uid);
    // if (planData.planType === "free") {
    //   return NextResponse.json(
    //     { error: "Inbox access requires Starter plan or higher" },
    //     { status: 403 }
    //   );
    // }

    // Check if user is owner or admin of workspace
    const workspaceDoc = await adminDB.collection("workspaces").doc(workspaceId).get();
    const workspaceData = workspaceDoc.data();

    if (workspaceData?.ownerUid !== uid && !workspaceData?.memberIds?.includes(uid)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Encrypt sensitive data
    const { encryptSmtpConfig, encrypt } = await import("@/lib/encryption");
    
    // Ensure port is a number
    const port = parseInt(smtpConfig.port, 10);
    
    const encryptedConfig = encryptSmtpConfig({
      host: smtpConfig.host,
      port: isNaN(port) ? 587 : port,
      user: smtpConfig.username || smtpConfig.user, 
      password: smtpConfig.password,
    });

    // Encrypt IMAP password if present
    let encryptedImapPassword = null;
    if (smtpConfig.imapPassword) {
        encryptedImapPassword = encrypt(smtpConfig.imapPassword);
    }

    // Save SMTP config to workspace settings
    await adminDB
      .collection("workspaces")
      .doc(workspaceId)
      .collection("settings")
      .doc("smtp")
      .set({
        ...encryptedConfig, // host, port, user, encryptedPassword
        fromName: smtpConfig.fromName,
        fromEmail: smtpConfig.fromEmail,
        
        // IMAP Settings
        imapHost: smtpConfig.imapHost,
        imapPort: smtpConfig.imapPort,
        imapUsername: smtpConfig.imapUsername,
        encryptedImapPassword: encryptedImapPassword,
        
        updatedAt: Date.now(),
        updatedBy: uid,
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SMTP CONFIG ERROR:", error);
    return NextResponse.json({ error: "Failed to save SMTP config" }, { status: 500 });
  }
}
