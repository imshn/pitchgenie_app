import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      console.log("❌ Missing auth token");
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { leadId, subject, body } = await req.json();

    if (!leadId || !subject || !body) {
      console.log("❌ Missing required fields =>", { leadId, subject, body });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get Lead
    const leadRef = adminDB.collection("leads").doc(leadId);
    const leadSnap = await leadRef.get();

    if (!leadSnap.exists) {
      console.log("❌ Lead not found:", leadId);
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = leadSnap.data();
    const sendTo = lead?.email;

    if (!sendTo) {
      console.log("❌ Lead has no email. Lead:", lead);
      return NextResponse.json(
        { error: "Lead has no email property" },
        { status: 400 }
      );
    }

    // Nodemailer SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL!,
        pass: process.env.SMTP_PASSWORD!,
      },
    });

    await transporter.sendMail({
      from: `"${decoded.email}" <${process.env.SMTP_EMAIL!}>`,
      to: sendTo,
      subject,
      html: body.replace(/\n/g, "<br/>"),
    });

    // Update Lead
    await leadRef.update({
      lastSentAt: Date.now(),
      status: "contacted",
    });

    // Analytics
    await adminDB
      .collection("users")
      .doc(uid)
      .collection("events")
      .add({
        type: "sent",
        leadId,
        timestamp: Date.now(),
      });

    await adminDB
      .collection("users")
      .doc(uid)
      .collection("analytics")
      .doc("summary")
      .set(
        {
          sent: FieldValue.increment(1),
          updatedAt: Date.now(),
        },
        { merge: true }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🚨 SEND EMAIL ERROR:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
