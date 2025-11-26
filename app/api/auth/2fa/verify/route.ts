import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { adminDB } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { code } = await req.json();

    if (!code) {
        return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    // 1. Get stored code
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const mfaPending = userData?.mfaPending;

    if (!mfaPending || !mfaPending.code) {
        return NextResponse.json({ error: "No verification pending" }, { status: 400 });
    }

    // 2. Verify code and expiration
    if (Date.now() > mfaPending.expiresAt) {
        return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    if (mfaPending.code !== code) {
        return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // 3. Enable 2FA
    await adminDB.collection("users").doc(uid).update({
      twoFactorEnabled: true,
      twoFactorMethod: "email",
      mfaPending: null // Clear pending
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("VERIFY 2FA ERROR:", error);
    return NextResponse.json(
        { error: error.message || "Failed to verify code" }, 
        { status: 500 }
    );
  }
}
