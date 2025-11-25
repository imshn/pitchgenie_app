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

    // 2. Fetch user data from Firestore
    const userDoc = await adminDB.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // 3. Return onboarding-related fields
    return NextResponse.json({
      onboardingCompleted: userData?.onboardingCompleted || false,
      onboardingStep: userData?.onboardingStep || 1,
      firstTimeTourCompleted: userData?.firstTimeTourCompleted ?? false,
      name: userData?.name || "",
      gender: userData?.gender || "",
      role: userData?.role || "",
      persona: userData?.persona || "",
      companyName: userData?.companyName || "",
      companyWebsite: userData?.companyWebsite || "",
      companyDescription: userData?.companyDescription || "",
      companyLocation: userData?.companyLocation || "",
      servicesOffered: userData?.servicesOffered || [],
      plan: userData?.plan || "free",
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
