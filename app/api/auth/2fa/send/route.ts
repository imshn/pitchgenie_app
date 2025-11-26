import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { adminDB } from "@/lib/firebase-admin";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { uid, email } = await verifyUser();

    // 1. Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 2. Store in Firestore (temporary collection or field)
    await adminDB.collection("users").doc(uid).update({
      mfaPending: {
        code,
        expiresAt,
      }
    });

    // 3. Send Email using System SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.SMTP_EMAIL;
    const fromName = process.env.SMTP_FROM_NAME || "PitchGenie Security";

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: "Your 2FA Verification Code",
      text: `Your verification code is: ${code}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>2FA Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 5px; background: #f4f4f5; padding: 10px; display: inline-block; border-radius: 5px;">${code}</h1>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("SEND 2FA ERROR:", error);
    return NextResponse.json(
        { error: error.message || "Failed to send verification code" }, 
        { status: 500 }
    );
  }
}
