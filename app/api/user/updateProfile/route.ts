import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/verify-user";
import { adminDB, adminAuth } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyUser();
    const { displayName, timezone, language } = await req.json();

    if (!displayName) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    // 1. Update Firebase Auth Profile
    await adminAuth.updateUser(uid, {
      displayName,
    });

    // 2. Update Firestore User Document (Root)
    await adminDB.collection("users").doc(uid).set({
      displayName,
      preferences: {
        timezone: timezone || "UTC",
        language: language || "en"
      },
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 3. Update Firestore Profile Document (Subcollection)
    // This is where the app reads detailed profile info from
    await adminDB.collection("users").doc(uid).collection("profile").doc("main").set({
      displayName,
      timezone: timezone || "UTC",
      // email is usually immutable or handled separately, but we can ensure it's there if needed
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[POST /api/user/updateProfile] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
