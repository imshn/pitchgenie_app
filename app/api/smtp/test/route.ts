import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import { decrypt } from "@/lib/crypto";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();

    // Fetch SMTP settings
    const smtpDoc = await adminDB
      .collection("users")
      .doc(uid)
      .collection("smtp")
      .doc("config")
      .get();

    if (!smtpDoc.exists) {
      return NextResponse.json(
        { error: "SMTP settings not found" },
        { status: 404 }
      );
    }

    const smtp = smtpDoc.data();
    if (!smtp) {
      return NextResponse.json(
        { error: "Invalid SMTP configuration" },
        { status: 400 }
      );
    }

    // Decrypt password
    let password;
    try {
      password = decrypt(smtp.password);
    } catch (e) {
      console.error("Decryption failed:", e);
      return NextResponse.json(
        { error: "Failed to decrypt SMTP password" },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.encryption === "ssl", // true for 465, false for other ports
      auth: {
        user: smtp.username,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certs if needed, or remove for stricter security
      },
    });

    // Verify connection
    await transporter.verify();

    return NextResponse.json({ success: true, message: "Connection successful" });
  } catch (error: any) {
    console.error("SMTP TEST ERROR:", error);
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Connection failed: " + (error.message || "Unknown error") },
      { status: 400 }
    );
  }
}
