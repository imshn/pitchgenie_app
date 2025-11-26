import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { adminDB } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();

    // Disable 2FA
    await adminDB.collection("users").doc(uid).update({
      twoFactorEnabled: false,
      twoFactorMethod: null,
      mfaPending: null
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DISABLE 2FA ERROR:", error);
    return NextResponse.json(
        { error: error.message || "Failed to disable 2FA" }, 
        { status: 500 }
    );
  }
}
