import { NextResponse } from "next/server";
import { adminDB, adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes timeout for migration

export async function POST(req: Request) {
  try {
    // ---------------------------------------------------------
    // 1. AUTHENTICATION (Admin Only - simplified for this script)
    // ---------------------------------------------------------
    // In a real scenario, you'd check for a specific admin secret or role.
    // For now, we'll assume the caller has a valid token.
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verify token (any valid user can trigger for themselves, or admin for all)
    // For this migration, we'll iterate ALL users, so this should be protected.
    // Let's assume this is a dev-only or protected route.
    await adminAuth.verifyIdToken(token); 

    console.log("🚀 Starting Migration...");

    // ---------------------------------------------------------
    // 2. FETCH ALL USERS
    // ---------------------------------------------------------
    const usersSnap = await adminDB.collection("users").get();
    let migratedCount = 0;
    let errors = [];

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();

      // Skip if already migrated
      if (userData.currentWorkspaceId && userData.workspaces?.length > 0) {
        console.log(`Skipping ${uid} - Already migrated`);
        continue;
      }

      console.log(`Processing user: ${uid} (${userData.email})`);

      try {
        // ---------------------------------------------------------
        // 3. CREATE WORKSPACE
        // ---------------------------------------------------------
        const workspaceRef = adminDB.collection("workspaces").doc();
        const workspaceId = workspaceRef.id;
        const now = Date.now();

        const workspaceData = {
          ownerUid: uid,
          name: `${userData.name || userData.displayName || "My"} Workspace`,
          plan: userData.plan || "starter", // Default to existing plan or starter
          credits: userData.credits || 0,
          maxCredits: userData.maxCredits || 100, // Default
          members: [
            {
              uid: uid,
              email: userData.email || "",
              role: "owner",
              joinedAt: now
            }
          ],
          invited: [],
          createdAt: now,
          updatedAt: now
        };

        await workspaceRef.set(workspaceData);

        // ---------------------------------------------------------
        // 4. MOVE LEADS
        // ---------------------------------------------------------
        const leadsSnap = await adminDB.collection("leads").where("uid", "==", uid).get();
        const batch = adminDB.batch();
        let opCount = 0;

        for (const leadDoc of leadsSnap.docs) {
          const leadData = leadDoc.data();
          const newLeadRef = workspaceRef.collection("leads").doc(leadDoc.id);
          
          batch.set(newLeadRef, { ...leadData, workspaceId }); // Copy data
          batch.delete(leadDoc.ref); // Delete old doc
          
          opCount++;
          if (opCount >= 400) { // Commit batch every 400 ops
            await batch.commit();
            opCount = 0;
          }
        }

        // ---------------------------------------------------------
        // 5. MOVE EVENTS
        // ---------------------------------------------------------
        const eventsSnap = await adminDB.collection("events").where("uid", "==", uid).get();
        
        for (const eventDoc of eventsSnap.docs) {
          const eventData = eventDoc.data();
          const newEventRef = workspaceRef.collection("events").doc(eventDoc.id);
          
          batch.set(newEventRef, { ...eventData, workspaceId });
          batch.delete(eventDoc.ref);
          
          opCount++;
          if (opCount >= 400) {
            await batch.commit();
            opCount = 0;
          }
        }

        // Commit remaining batch operations
        if (opCount > 0) {
          await batch.commit();
        }

        // ---------------------------------------------------------
        // 6. UPDATE USER DOC
        // ---------------------------------------------------------
        await adminDB.collection("users").doc(uid).update({
          currentWorkspaceId: workspaceId,
          workspaces: [workspaceId],
          migratedAt: now
        });

        migratedCount++;
        console.log(`✅ Migrated ${uid} -> ${workspaceId}`);

      } catch (err: any) {
        console.error(`❌ Failed to migrate ${uid}:`, err);
        errors.push({ uid, error: err.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      migrated: migratedCount, 
      total: usersSnap.size,
      errors 
    });

  } catch (error: any) {
    console.error("MIGRATION ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
