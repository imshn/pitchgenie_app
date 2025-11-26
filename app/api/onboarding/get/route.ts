/**
 * GET /api/onboarding/get
 * 
 * Fetches user onboarding data
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Firebase token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Fetch user data & profile from Firestore
    const userRef = adminDB.collection("users").doc(uid);
    const profileRef = userRef.collection("profile").doc("main");

    const [userDoc, profileDoc] = await Promise.all([
      userRef.get(),
      profileRef.get()
    ]);
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const profileData = profileDoc.exists ? profileDoc.data() : {};

    // 3. Return onboarding-related fields
    return NextResponse.json({
      onboardingCompleted: userData?.onboardingCompleted || false,
      onboardingStep: userData?.onboardingStep || 1,
      firstTimeTourCompleted: userData?.firstTimeTourCompleted ?? false,
      name: profileData?.name || userData?.name || "",
      gender: profileData?.gender || userData?.gender || "",
      role: profileData?.role || userData?.role || "",
      persona: profileData?.persona || userData?.persona || "",
      companyName: profileData?.companyName || userData?.companyName || "",
      companyWebsite: profileData?.companyWebsite || userData?.companyWebsite || "",
      companyDescription: profileData?.companyDescription || userData?.companyDescription || "",
      companyLocation: profileData?.companyLocation || userData?.companyLocation || "",
      servicesOffered: profileData?.servicesOffered || userData?.servicesOffered || [],
      plan: userData?.planType || userData?.plan || "free",
      email: userData?.email || decodedToken.email || "",
    });

  } catch (error: any) {
    console.error("[Onboarding] Get data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding data" },
      { status: 500 }
    );
  }
}
