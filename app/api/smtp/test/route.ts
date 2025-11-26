import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { adminDB } from "@/lib/firebase-admin";
import { encryptSmtpConfig } from "@/lib/encryption";
import nodemailer from "nodemailer";

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

    console.log(`[POST /api/smtp/test] Testing SMTP for user ${uid}: ${host}:${port}`);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host,
      port: portNumber,
      secure: portNumber === 465,
      auth: {
        user,
        pass: password,
      },
      connectionTimeout: 10000, // 10 seconds
    });

    // Verify connection
    try {
      await transporter.verify();
    } catch (error: any) {
      console.error("[POST /api/smtp/test] Verification failed:", error);
      
      if (error.code === "EAUTH" || error.responseCode === 535) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Authentication failed. Please check your username and password." 
          },
          { status: 401 }
        );
      }

      if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
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
          error: error.message || "SMTP verification failed"
        },
        { status: 400 }
      );
    }

    // Save config if requested
    if (saveConfig) {
      const encryptedConfig = encryptSmtpConfig({
        host,
        port: portNumber,
        user,
        password,
      });

      await adminDB.collection("users").doc(uid).update({
        smtpConfig: encryptedConfig,
        smtpConfiguredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`[POST /api/smtp/test] Saved SMTP config for user ${uid}`);
    }

    return NextResponse.json({
      success: true,
      message: "SMTP configuration is valid",
      saved: saveConfig || false,
    });
  } catch (error: any) {
    console.error("[POST /api/smtp/test] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to test SMTP" },
      { status: 500 }
    );
  }
}
