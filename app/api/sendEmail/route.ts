import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { checkAndConsumeOperation } from "@/lib/server/checkAndConsumeOperation";
import { adminDB, FieldValue } from "@/lib/firebase-admin";
import { decryptSmtpConfig } from "@/lib/encryption";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { to, subject, body, leadId } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "to, subject, and body are required" },
        { status: 400 }
      );
    }

    // Check and consume credits (1 credit + SMTP daily limit)
    await checkAndConsumeOperation(uid, "smtpSend");

    // Get user's SMTP config
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const userData = userDoc.data();

    if (!userData?.smtpConfig?.encryptedPassword) {
      return NextResponse.json(
        { error: "SMTP configuration not found. Please configure SMTP settings." },
        { status: 400 }
      );
    }

    // Decrypt SMTP credentials
    const smtpConfig = decryptSmtpConfig(userData.smtpConfig);

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465, // true for 465, false for other ports
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: smtpConfig.user,
      to,
      subject,
      html: body,
    });

    // Log email sent
    await adminDB
      .collection("users")
      .doc(uid)
      .collection("emailsSent")
      .add({
        to,
        subject,
        body,
        leadId: leadId || null,
        messageId: info.messageId,
        sentAt: new Date().toISOString(),
      });

    // Update lead if leadId provided
    if (leadId) {
      const workspaceId = userData.currentWorkspaceId;
      if (workspaceId) {
        await adminDB
          .collection("workspaces")
          .doc(workspaceId)
          .collection("leads")
          .doc(leadId)
          .update({
            lastEmailSent: new Date().toISOString(),
            emailCount: FieldValue.increment(1),
            updatedAt: new Date().toISOString(),
          });
      }
    }

    console.log(`[POST /api/sendEmail] Email sent to ${to} by user ${uid}`);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error("[POST /api/sendEmail] Error:", error);

    // Check for specific error codes
    if (error.message?.includes("INSUFFICIENT_CREDITS")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_CREDITS",
            message: "Insufficient monthly credits. Please upgrade your plan."
          }
        },
        { status: 402 }
      );
    }

    if (error.message?.includes("SMTP_DAILY_LIMIT")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SMTP_LIMIT",
            message: "Daily SMTP limit reached. Try again tomorrow or upgrade plan."
          }
        },
        { status: 403 }
      );
    }

    // SMTP errors
    if (error.code === "EAUTH" || error.responseCode === 535) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SMTP_AUTH_ERROR",
            message: "SMTP authentication failed. Please check your credentials."
          }
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to send email"
        }
      },
      { status: 500 }
    );
  }
}
