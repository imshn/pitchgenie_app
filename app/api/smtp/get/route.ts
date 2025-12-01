import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { adminDB } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const { uid } = await verifyUser();

    // Get user's current workspace
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const workspaceId = userData?.currentWorkspaceId;

    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    // Get SMTP config
    const smtpDoc = await adminDB
      .collection("workspaces")
      .doc(workspaceId)
      .collection("settings")
      .doc("smtp")
      .get();

    if (!smtpDoc.exists) {
      return NextResponse.json({ smtpConfig: null });
    }

    const data = smtpDoc.data();
    
    // Decrypt if encrypted
    let decryptedConfig: any = data;
    if (data?.encryptedPassword) {
        const { decryptSmtpConfig, decrypt } = await import("@/lib/encryption");
        try {
            const decrypted = decryptSmtpConfig({
                host: data.host,
                port: data.port,
                user: data.user,
                encryptedPassword: data.encryptedPassword
            });
            
            decryptedConfig = {
                ...data,
                ...decrypted,
                username: decrypted.user, // Map back to username for frontend
                password: decrypted.password
            };

            // Decrypt IMAP password if present
            if (data.encryptedImapPassword) {
                decryptedConfig.imapPassword = decrypt(data.encryptedImapPassword);
            }
        } catch (err) {
            console.error("Failed to decrypt SMTP config:", err);
            // Fallback to empty password if decryption fails
            decryptedConfig = { ...data, password: "" };
        }
    }

    return NextResponse.json({ smtpConfig: decryptedConfig });
  } catch (error) {
    console.error("SMTP GET ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch SMTP config" }, { status: 500 });
  }
}
