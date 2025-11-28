import { NextResponse } from "next/server";
import { adminAuth, adminDB, FieldValue, Timestamp } from "@/lib/firebase-admin";

// Helper to format date as YYYY-MM-DD
function getCycleId(date: Date): string {
  return date.toISOString().split("T")[0];
}

function generateWorkspaceName(email: string | undefined, displayName: string | undefined): string {
  const name = displayName || email?.split("@")[0] || "User";
  return `${name}'s Workspace`;
}

export async function POST(req: Request) {
  const logPrefix = "[Auth Bootstrap]";
  const createdDocs: string[] = [];
  const existedDocs: string[] = [];
  
  try {
    // 1. Authentication & Validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let uid: string;
    let email: string | undefined;
    let displayName: string | undefined;

    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
      email = decodedToken.email;
      // Use token display name or fallback
      displayName = decodedToken.name; 
    } catch (e) {
      console.error(`${logPrefix} Token verification failed:`, e);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Parse body for optional params
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      // Body might be empty, ignore
    }

    const { requestedPlan, idempotencyKey } = body;
    
    // Use body values as fallback if token missing them (rare)
    if (!email && body.email) email = body.email;
    if (!displayName && body.displayName) displayName = body.displayName || body.fullName;

    console.log(`${logPrefix} Starting bootstrap for user ${uid} (${email})`);

    // 2. Plan Validation
    let planType = "free";
    let onboardingCompleted = false;

    if (requestedPlan) {
      const planDoc = await adminDB.collection("plans").doc(requestedPlan).get();
      if (!planDoc.exists) {
        console.warn(`${logPrefix} Invalid requested plan: ${requestedPlan}`);
        return NextResponse.json({ error: "Invalid requested plan" }, { status: 400 });
      }
      planType = requestedPlan;
      onboardingCompleted = true; // Paid plans skip onboarding
    }

    // 3. Transactional Bootstrap
    const result = await adminDB.runTransaction(async (t) => {
      const userRef = adminDB.collection("users").doc(uid);
      const userDoc = await t.get(userRef);
      
      let userData = userDoc.exists ? userDoc.data()! : {};
      let isNewUser = !userDoc.exists;
      
      // Determine Billing Cycle
      const now = new Date();
      let billingStartDate = userData.billingStartDate?.toDate() || now;
      
      // If new user with paid plan, or existing user upgrading (though upgrade usually happens via webhook),
      // strictly speaking this bootstrap is for signup/login. 
      // If new user, billingStartDate is NOW.
      // If existing user, keep existing.
      
      // Calculate cycle details
      const nextResetDate = new Date(billingStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const currentCycleId = getCycleId(billingStartDate);
      
      // Prepare User Data
      const userUpdate: any = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (isNewUser) {
        createdDocs.push("users");
        userUpdate.email = email;
        userUpdate.displayName = displayName || "";
        userUpdate.planType = planType;
        userUpdate.onboardingCompleted = onboardingCompleted;
        userUpdate.billingStartDate = Timestamp.fromDate(billingStartDate);
        userUpdate.nextResetDate = Timestamp.fromDate(nextResetDate);
        userUpdate.currentCycleId = currentCycleId;
        userUpdate.createdAt = FieldValue.serverTimestamp();
      } else {
        existedDocs.push("users");
        // Auto-heal missing fields
        if (!userData.planType) userUpdate.planType = "free";
        if (userData.onboardingCompleted === undefined) {
          // If paid or legacy free, mark completed to avoid forcing onboarding
          const currentPlan = userData.planType || "free";
          userUpdate.onboardingCompleted = currentPlan !== "free" ? true : true; 
        }
        if (!userData.billingStartDate) {
            userUpdate.billingStartDate = Timestamp.fromDate(billingStartDate);
            userUpdate.nextResetDate = Timestamp.fromDate(nextResetDate);
            userUpdate.currentCycleId = currentCycleId;
        }
      }

      // Workspace Logic
      let workspaceId = userData.currentWorkspaceId || userData.workspaceId;
      let workspaceRef: FirebaseFirestore.DocumentReference;
      
      if (!workspaceId) {
        // Create new workspace
        workspaceRef = adminDB.collection("workspaces").doc();
        workspaceId = workspaceRef.id;
        createdDocs.push("workspace");
        
        t.set(workspaceRef, {
          workspaceName: generateWorkspaceName(email, displayName),
          ownerUid: uid,
          members: [{
            uid,
            email,
            role: "owner",
            joinedAt: Timestamp.fromDate(now)
          }],
          memberIds: [uid],
          planId: userUpdate.planType || userData.planType || "free",
          billingStartDate: Timestamp.fromDate(billingStartDate),
          nextResetDate: Timestamp.fromDate(nextResetDate),
          currentCycleId: currentCycleId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });

        userUpdate.currentWorkspaceId = workspaceId;
        userUpdate.workspaces = FieldValue.arrayUnion(workspaceId);
      } else {
        workspaceRef = adminDB.collection("workspaces").doc(workspaceId);
        const wsDoc = await t.get(workspaceRef);
        if (!wsDoc.exists) {
            // Re-create if missing (Auto-heal)
            createdDocs.push("workspace");
            t.set(workspaceRef, {
                workspaceName: generateWorkspaceName(email, displayName),
                ownerUid: uid,
                members: [{
                    uid,
                    email,
                    role: "owner",
                    joinedAt: Timestamp.fromDate(now)
                }],
                memberIds: [uid],
                planId: userUpdate.planType || userData.planType || "free",
                billingStartDate: Timestamp.fromDate(billingStartDate),
                nextResetDate: Timestamp.fromDate(nextResetDate),
                currentCycleId: currentCycleId,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
        } else {
            existedDocs.push("workspace");
        }
      }

      // Profile Logic
      const profileRef = userRef.collection("profile").doc("main"); // Using 'main' as canonical
      const profileDoc = await t.get(profileRef);
      if (!profileDoc.exists) {
        createdDocs.push("profile");
        t.set(profileRef, {
          displayName: displayName || "",
          email: email || "",
          company: {
            name: "",
            website: "",
            industry: "",
            size: "",
            about: "",
            services: []
          },
          persona: null,
          pitchTone: null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        existedDocs.push("profile");
      }

      // User Usage Logic
      const userUsageRef = userRef.collection("usage").doc(currentCycleId);
      const userUsageDoc = await t.get(userUsageRef);
      if (!userUsageDoc.exists) {
        createdDocs.push("usage");
        t.set(userUsageRef, {
          creditsUsed: 0,
          lightScrapesUsed: 0,
          deepScrapesUsed: 0,
          sequencesUsed: 0,
          templatesUsed: 0,
          smtpEmailsSent: 0,
          imapSyncCount: 0,
          aiGenerations: 0,
          resetDate: Timestamp.fromDate(nextResetDate),
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        existedDocs.push("usage");
      }

      // Workspace Usage Logic
      const wsUsageRef = workspaceRef.collection("usage").doc(currentCycleId);
      const wsUsageDoc = await t.get(wsUsageRef);
      if (!wsUsageDoc.exists) {
        createdDocs.push("workspaceUsage");
        t.set(wsUsageRef, {
          creditsUsed: 0,
          lightScrapesUsed: 0,
          deepScrapesUsed: 0,
          sequencesUsed: 0,
          templatesUsed: 0,
          smtpEmailsSent: 0,
          imapSyncCount: 0,
          aiGenerations: 0,
          resetDate: Timestamp.fromDate(nextResetDate),
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        existedDocs.push("workspaceUsage");
      }

      // Commit User Updates
      if (isNewUser) {
        t.set(userRef, userUpdate);
      } else {
        t.update(userRef, userUpdate);
      }

      return {
        uid,
        workspaceId,
        currentCycleId,
        billingStartDate: billingStartDate.toISOString(),
        nextResetDate: nextResetDate.toISOString()
      };
    });

    console.log(`${logPrefix} Completed bootstrap for ${uid}. Created: ${createdDocs.join(", ")}`);

    return NextResponse.json({
      success: true,
      ...result,
      created: createdDocs,
      existed: existedDocs
    });

  } catch (error: any) {
    console.error(`${logPrefix} Error:`, error);
    return NextResponse.json({ error: error.message || "Bootstrap failed" }, { status: 500 });
  }
}
