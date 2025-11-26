import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { adminDB } from "@/lib/firebase-admin";
import { encryptSmtpConfig } from "@/lib/encryption";
import { ImapFlow } from "imapflow";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { host, port, user, password, saveConfig } = await req.json();

    if (!host || !port || !user || !password) {
      return NextResponse.json(
        { error: "host, port, user, and password are required" },
        { status: 400 }
      );
    }

    // Validate port
    const portNumber = parseInt(port);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      return NextResponse.json(
        { error: "Invalid port number" },
        { status: 400 }
      );
    }

    console.log(`[POST /api/imap/test] Testing IMAP for user ${uid}: ${host}:${port}`);

    // Create IMAP client
    const client = new ImapFlow({
      host,
      port: portNumber,
      secure: portNumber === 993,
      auth: {
        user,
        pass: password,
      },
      logger: false,
    });

    // Test connection
    try {
      await client.connect();
      
      // Get mailbox info
      const status = await client.status("INBOX", { messages: true });
      const messageCount = status.messages;

      await client.logout();

      console.log(`[POST /api/imap/test] IMAP test successful. Inbox has ${messageCount} messages`);

      // Save config if requested
      if (saveConfig) {
        const encryptedConfig = encryptSmtpConfig({
          host,
          port: portNumber,
          user,
          password,
        });

        await adminDB.collection("users").doc(uid).update({
          imapConfig: encryptedConfig,
          imapConfiguredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        console.log(`[POST /api/imap/test] Saved IMAP config for user ${uid}`);
      }

      return NextResponse.json({
        success: true,
        message: "IMAP configuration is valid",
        messageCount,
        saved: saveConfig || false,
      });
    } catch (error: any) {
      console.error("[POST /api/imap/test] Connection failed:", error);

      if (error.authenticationFailed) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication failed. Please check your username and password."
          },
          { status: 401 }
        );
      }

      if (error.code === "ETIMEDOUT" || error.code === "ECONNREFUSED") {
        return NextResponse.json(
          {
            success: false,
            error: "Connection failed. Please check host and port settings."
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message || "IMAP verification failed"
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[POST /api/imap/test] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to test IMAP" },
      { status: 500 }
    );
  }
}
