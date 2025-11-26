/**
 * POST /api/onboarding/update
 * 
 * Updates user profile and onboarding step
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
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

    // 2. Parse request body
    const body = await req.json();
    const {
      onboardingStep,
      name,
      gender,
      role,
      persona,
      companyName,
      companyWebsite,
      companyDescription,
      companyLocation,
      servicesOffered,
    } = body;

    // 3. Build update object
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (onboardingStep !== undefined) updateData.onboardingStep = onboardingStep;
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (role !== undefined) updateData.role = role;
    if (persona !== undefined) updateData.persona = persona;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (companyWebsite !== undefined) updateData.companyWebsite = companyWebsite;
    if (companyDescription !== undefined) updateData.companyDescription = companyDescription;
    if (companyLocation !== undefined) updateData.companyLocation = companyLocation;
    if (servicesOffered !== undefined) updateData.servicesOffered = servicesOffered;

    // 4. Update Firestore (Profile Subcollection)
    await adminDB.collection("users").doc(uid).collection("profile").doc("main").set(updateData, { merge: true });
    
    // Also update onboarding step on the user doc itself
    if (onboardingStep !== undefined) {
        await adminDB.collection("users").doc(uid).update({ onboardingStep });
    }

    console.log(`[Onboarding] Updated data for user ${uid}`);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[Onboarding] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update onboarding data" },
      { status: 500 }
    );
  }
}
