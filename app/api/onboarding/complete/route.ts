/**
 * POST /api/onboarding/complete
 * 
 * Marks onboarding as complete and sets up the workspace plan.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDB, FieldValue } from "@/lib/firebase-admin";
import { PLAN_CONFIGS } from "@/lib/credit-types";

function generateWorkspaceName(email: string): string {
  const prefix = email.split("@")[0];
  const capitalized = prefix.charAt(0).toUpperCase() + prefix.slice(1);
  return `${capitalized}'s Workspace`;
}

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
    const email = decodedToken.email;

    // 2. Parse request body for plan selection
    const body = await req.json();
    const { plan = "free" } = body;

    // 3. Get plan config
    const planConfig = PLAN_CONFIGS[plan as keyof typeof PLAN_CONFIGS] || PLAN_CONFIGS.free;
    const now = Date.now();

    // 4. Get User to find current workspace
    const userDoc = await adminDB.collection("users").doc(uid).get();
    const userData = userDoc.data() || {};
    let workspaceId = userData.currentWorkspaceId;

    // 5. If no workspace, create one
    if (!workspaceId) {
        const workspaceRef = adminDB.collection("workspaces").doc();
        workspaceId = workspaceRef.id;
        
        const workspaceData = {
            workspaceName: generateWorkspaceName(email || "User"),
            ownerUid: uid,
            members: [{
                uid,
                email,
                role: "owner",
                joinedAt: now
            }],
            memberIds: [uid],
            invited: [],
            createdAt: now,
            updatedAt: now
        };
        
        await workspaceRef.set(workspaceData);
        
        // Link to user
        await adminDB.collection("users").doc(uid).set({
            workspaces: FieldValue.arrayUnion(workspaceId),
            currentWorkspaceId: workspaceId
        }, { merge: true });
    }

    // 6. Update Workspace with Plan Details (Only planId, no limits)
    await adminDB.collection("workspaces").doc(workspaceId).update({
        planId: plan,
        updatedAt: now
    });

    // 7. Initialize Usage for Current Month
    const date = new Date();
    // Use YYYY-MM-DD to match billing cycle logic
    const monthId = date.toISOString().split('T')[0];
    await adminDB
        .collection("workspaces")
        .doc(workspaceId)
        .collection("usage")
        .doc(monthId)
        .set({
            creditsUsed: 0,
            scraperUsed: 0,
            sequencesUsed: 0,
            templatesUsed: 0,
            smtpEmailsSent: 0,
            aiToneUsed: 0,
            resetDate: now,
            updatedAt: now
        }, { merge: true });

    // 8. Mark User Onboarding as Complete
    await adminDB.collection("users").doc(uid).update({
      onboardingCompleted: true,
      onboardingStep: 4,
      // planType: plan, // REMOVED: Onboarding must never overwrite planType
      updatedAt: now,
    });

    // 8. Log event
    await adminDB
      .collection("users")
      .doc(uid)
      .collection("events")
      .add({
        type: "onboarding_completed",
        plan,
        workspaceId,
        timestamp: now,
      });

    console.log(`[Onboarding] User ${uid} completed onboarding with ${plan} plan in workspace ${workspaceId}`);

    return NextResponse.json({ success: true, workspaceId });

  } catch (error: any) {
    console.error("[Onboarding] Complete error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
