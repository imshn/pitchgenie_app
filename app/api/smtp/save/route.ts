import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import { encrypt } from "@/lib/crypto";
import { z } from "zod";

const smtpSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().int().positive("Port must be a positive integer"),
  username: z.string().min(1, "Username is required"),
  password: z.string().optional().or(z.literal("")), // Allow empty or undefined
  fromName: z.string().min(1, "From Name is required"),
  fromEmail: z.string().email("Invalid email address"),
  encryption: z.enum(["ssl", "tls", "none"]),
});

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const body = await req.json();

    const validation = smtpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { host, port, username, password, fromName, fromEmail, encryption } = validation.data;

    let encryptedPassword;

    if (password) {
      // Encrypt new password
      encryptedPassword = encrypt(password);
    } else {
      // Fetch existing config to keep old password
      const existingDoc = await adminDB
        .collection("users")
        .doc(uid)
        .collection("smtp")
        .doc("config")
        .get();

      if (existingDoc.exists) {
        encryptedPassword = existingDoc.data()?.password;
      }

      if (!encryptedPassword) {
        return NextResponse.json(
          { error: "Password is required for initial setup" },
          { status: 400 }
        );
      }
    }

    // Save to Firestore
    await adminDB.collection("users").doc(uid).collection("smtp").doc("config").set({
      host,
      port,
      username,
      password: encryptedPassword,
      fromName,
      fromEmail,
      encryption,
      updatedAt: Date.now(),
      createdAt: Date.now(), // In a real app, use set with merge: true and handle createdAt separately if needed
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("SMTP SAVE ERROR:", error);
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to save SMTP settings" },
      { status: 500 }
    );
  }
}
