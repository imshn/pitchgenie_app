import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import { logEvent } from "@/lib/analytics-server";
import nodemailer from "nodemailer";
import { verifyUser } from "@/lib/verify-user";
import { limiter } from "@/lib/rate-limit";
import { decrypt } from "@/lib/crypto";
import { z } from "zod";

const sendEmailSchema = z.object({
  leadId: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    // ------------------ AUTH & RATE LIMIT ------------------
    const { uid, email } = await verifyUser();
    
    try {
      await limiter.check(20, uid); // 20 requests per minute (increased for sending)
    } catch {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // ------------------ INPUT VALIDATION ------------------
    const body = await req.json();
    const validation = sendEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { leadId, subject, body: emailBody } = validation.data;

    // ------------------ OWNERSHIP CHECK ------------------
    const leadRef = adminDB.collection("leads").doc(leadId);
    const leadSnap = await leadRef.get();

    if (!leadSnap.exists || leadSnap.data()?.uid !== uid) {
      return NextResponse.json({ error: "Lead not found or unauthorized" }, { status: 404 });
    }

    const lead = leadSnap.data();
    const sendTo = lead?.email;

    if (!sendTo) {
      return NextResponse.json(
        { error: "Lead has no email property" },
        { status: 400 }
      );
    }

    // ------------------ SMTP CONFIGURATION ------------------
    let transporter;
    let fromAddress;

    // Check for custom SMTP settings
    const smtpDoc = await adminDB
      .collection("users")
      .doc(uid)
      .collection("smtp")
      .doc("config")
      .get();

    if (smtpDoc.exists) {
      const smtp = smtpDoc.data()!;
      try {
        const password = decrypt(smtp.password);
        transporter = nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.encryption === "ssl",
          auth: {
            user: smtp.username,
            pass: password,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        fromAddress = `"${smtp.fromName}" <${smtp.fromEmail}>`;
      } catch (e) {
        console.error("Failed to decrypt SMTP password or create transporter:", e);
        // Fallback to system SMTP or error out? 
        // For now, let's error out to inform user their SMTP is broken
        return NextResponse.json(
          { error: "Custom SMTP configuration failed. Please check your settings." },
          { status: 400 }
        );
      }
    } else {
      // System SMTP Fallback
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_EMAIL!,
          pass: process.env.SMTP_PASSWORD!,
        },
      });
      fromAddress = `"${email}" <${process.env.SMTP_EMAIL!}>`;
    }

    // ------------------ SEND EMAIL ------------------
    await transporter.sendMail({
      from: fromAddress,
      to: sendTo,
      subject,
      html: emailBody.replace(/\n/g, "<br/>"),
    });

    // ------------------ UPDATE LEAD ------------------
    await leadRef.update({
      lastSentAt: Date.now(),
      status: "contacted",
    });

    // ------------------ ANALYTICS ------------------
    await logEvent(uid, {
      type: "email_sent",
      leadId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("🚨 SEND EMAIL ERROR:", error);
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to send email: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
