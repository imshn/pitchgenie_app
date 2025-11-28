import { adminDB } from "@/lib/firebase-admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export interface BillingCycleInfo {
  billingStartDate: Timestamp;
  nextResetDate: Timestamp;
  currentCycleId: string;
}

/**
 * Ensure user has a valid billing cycle and reset if expired.
 * Returns the current (valid) cycle ID.
 */
export async function ensureBillingCycle(userId: string): Promise<string> {
  const userRef = adminDB.collection("users").doc(userId);
  
  // Run inside transaction to prevent race conditions
  return await adminDB.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userSnap.data();
    const now = new Date();
    
    // 0. FIX: Check for misaligned billing cycle (Bad Migration Recovery)
    // Only for Free plans to avoid messing up paid plan upgrades
    if ((!userData?.planType || userData.planType === 'free') && userData?.createdAt && userData?.billingStartDate) {
        const createdAt = userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(userData.createdAt);
        const currentBillingStart = userData.billingStartDate instanceof Timestamp ? userData.billingStartDate.toDate() : new Date(userData.billingStartDate);
        
        // Calculate expected start based on creation date
        const diffTime = now.getTime() - createdAt.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const cyclesPassed = Math.floor(diffDays / 30);
        const expectedStart = new Date(createdAt.getTime() + cyclesPassed * 30 * 24 * 60 * 60 * 1000);

        // Check difference (allow 24h buffer)
        const timeDiff = Math.abs(currentBillingStart.getTime() - expectedStart.getTime());
        const isMisaligned = timeDiff > 24 * 60 * 60 * 1000;

        if (isMisaligned) {
             console.log(`[ensureBillingCycle] Detected misaligned cycle for ${userId}. Fixing...`);
             
             const newNextReset = new Date(expectedStart.getTime() + 30 * 24 * 60 * 60 * 1000);
             const newCycleId = expectedStart.toISOString().split('T')[0];
             
             // Get Monthly Usage to restore
             const currentMonthId = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
             const monthlyUsageRef = userRef.collection("usage").doc(currentMonthId);
             const monthlyUsageSnap = await transaction.get(monthlyUsageRef);
             
             // Update User
             transaction.update(userRef, {
                billingStartDate: Timestamp.fromDate(expectedStart),
                nextResetDate: Timestamp.fromDate(newNextReset),
                currentCycleId: newCycleId,
                updatedAt: FieldValue.serverTimestamp()
             });
             
             // Create/Update Correct Usage Doc
             const newUsageRef = userRef.collection("usage").doc(newCycleId);
             let usageData = {
                monthId: newCycleId,
                creditsUsed: 0,
                lightScrapesUsed: 0,
                deepScrapesUsed: 0,
                sequencesUsed: 0,
                templatesUsed: 0,
                smtpEmailsSent: 0,
                aiGenerations: 0,
                imapSyncCount: 0,
                resetDate: Timestamp.fromDate(newNextReset),
                updatedAt: FieldValue.serverTimestamp()
             };
             
             if (monthlyUsageSnap.exists) {
                 usageData = { ...usageData, ...monthlyUsageSnap.data(), monthId: newCycleId, resetDate: Timestamp.fromDate(newNextReset) };
             }
             
             transaction.set(newUsageRef, usageData, { merge: true });
             
             return newCycleId;
        }
    }
    
    // 1. Check if legacy user (no billingStartDate)
    if (!userData?.billingStartDate || !userData?.nextResetDate || !userData?.currentCycleId) {
      // Determine Anchor Date (Account Creation or Now)
      let anchorDate = now;
      if (userData?.createdAt) {
        // Handle Firestore Timestamp or Date
        anchorDate = userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : new Date(userData.createdAt);
      }

      // Calculate correct cycle start date based on 30-day intervals from anchorDate
      const diffTime = now.getTime() - anchorDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const cyclesPassed = Math.floor(diffDays / 30);
      
      // billingStartDate = anchorDate + (cyclesPassed * 30 days)
      const billingStart = new Date(anchorDate.getTime() + cyclesPassed * 30 * 24 * 60 * 60 * 1000);
      const nextReset = new Date(billingStart.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const billingStartDate = Timestamp.fromDate(billingStart);
      const nextResetDate = Timestamp.fromDate(nextReset);
      const currentCycleId = billingStart.toISOString().split('T')[0]; // YYYY-MM-DD

      // Check if usage doc exists for the NEW cycle (READ FIRST)
      const usageRef = userRef.collection("usage").doc(currentCycleId);
      const usageSnap = await transaction.get(usageRef);

      // Check for OLD monthly usage to migrate (READ SECOND)
      const currentMonthId = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
      const oldUsageRef = userRef.collection("usage").doc(currentMonthId);
      const oldUsageSnap = await transaction.get(oldUsageRef);

      // Update user doc (WRITE)
      transaction.update(userRef, {
        billingStartDate,
        nextResetDate,
        currentCycleId,
        updatedAt: FieldValue.serverTimestamp()
      });

      // Create initial usage doc if not exists (WRITE)
      if (!usageSnap.exists) {
        let initialUsage = {
          monthId: currentCycleId,
          creditsUsed: 0,
          lightScrapesUsed: 0,
          deepScrapesUsed: 0,
          sequencesUsed: 0,
          templatesUsed: 0,
          smtpEmailsSent: 0,
          aiGenerations: 0,
          imapSyncCount: 0,
          resetDate: nextResetDate,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        };

        // Migrate data if old monthly doc exists and we are in a transition
        // We only copy if the old doc has data and we are creating a new one
        if (oldUsageSnap.exists) {
            const oldData = oldUsageSnap.data();
            initialUsage = { ...initialUsage, ...oldData, monthId: currentCycleId, resetDate: nextResetDate, updatedAt: FieldValue.serverTimestamp() };
            console.log(`[ensureBillingCycle] Migrated usage from ${currentMonthId} to ${currentCycleId} for user ${userId}`);
        }

        transaction.set(usageRef, initialUsage);
      }

      return currentCycleId;
    }

    // 2. Check if cycle expired
    const nextReset = userData.nextResetDate.toDate();
    if (now >= nextReset) {
      // Reset Cycle
      const newBillingStartDate = Timestamp.fromDate(now);
      const newNextResetDate = Timestamp.fromDate(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
      const newCycleId = now.toISOString().split('T')[0];

      transaction.update(userRef, {
        billingStartDate: newBillingStartDate,
        nextResetDate: newNextResetDate,
        currentCycleId: newCycleId,
        updatedAt: FieldValue.serverTimestamp()
      });

      // Create fresh usage doc
      const usageRef = userRef.collection("usage").doc(newCycleId);
      transaction.set(usageRef, {
        monthId: newCycleId,
        creditsUsed: 0,
        lightScrapesUsed: 0,
        deepScrapesUsed: 0,
        sequencesUsed: 0,
        templatesUsed: 0,
        smtpEmailsSent: 0,
        aiGenerations: 0,
        imapSyncCount: 0,
        resetDate: newNextResetDate,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      return newCycleId;
    }

    // 3. Cycle is valid
    return userData.currentCycleId;
  });
}
