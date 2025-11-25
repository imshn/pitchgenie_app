import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";

export async function GET(req: Request) {
  try {
    const { uid } = await verifyUser();

    const smtpDoc = await adminDB
      .collection("users")
      .doc(uid)
      .collection("smtp")
      .doc("config")
      .get();

    if (!smtpDoc.exists) {
      return NextResponse.json({ smtp: null });
    }

    const smtp = smtpDoc.data();
    
    // Don't send back the encrypted password
    if (smtp) {
      delete smtp.password;
    }

    return NextResponse.json({ smtp });
  } catch (error: any) {
    console.error("SMTP GET ERROR:", error);
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch SMTP settings" },
      { status: 500 }
    );
  }
}
