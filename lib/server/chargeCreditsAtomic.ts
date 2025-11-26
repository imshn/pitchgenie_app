import { adminDB } from "@/lib/firebase-admin";
import { UsageIncrements } from "@/lib/types/plans";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Get current month in YYYY-MM format (UTC)
 */
function getCurrentMonthId(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get current date in YYYY-MM-DD format (UTC)
 */
function getCurrentDateId(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Atomically charge credits and increment usage counters
 * 
 * @param userId - Firebase user ID
 * @param monthId - Month ID (YYYY-MM format)
 * @param deltaCredits - Credits to deduct
 * @param increments - Usage counters to increment
 * @param verifyLimit - Optional plan credit limit to verify before charging
 * @returns Success boolean
 * @throws Error if transaction fails or limit would be exceeded
 */
export async function chargeCreditsAtomic(
  userId: string,
  monthId: string,
  deltaCredits: number,
  increments: UsageIncrements,
  verifyLimit?: number
): Promise<void> {
  const usageRef = adminDB
    .collection("users")
    .doc(userId)
    .collection("usage")
    .doc(monthId);

  const today = getCurrentDateId();
  const smtpDailyRef = increments.smtpEmailsSent
    ? adminDB
        .collection("users")
        .doc(userId)
        .collection("smtpDaily")
        .doc(today)
    : null;

  try {
    await adminDB.runTransaction(async (transaction) => {
      // Read usage document
      const usageSnap = await transaction.get(usageRef);

      let currentCreditsUsed = 0;

      if (usageSnap.exists) {
        const data = usageSnap.data();
        currentCreditsUsed = data?.creditsUsed || 0;
      }

      // Verify limit if provided
      if (verifyLimit !== undefined) {
        const newCreditsUsed = currentCreditsUsed + deltaCredits;
        if (newCreditsUsed > verifyLimit) {
          throw new Error(
            `INSUFFICIENT_CREDITS: Would exceed limit (${newCreditsUsed}/${verifyLimit})`
          );
        }
      }

      // Prepare usage updates
      const updates: any = {
        monthId,
        creditsUsed: (usageSnap.exists ? currentCreditsUsed : 0) + deltaCredits,
        updatedAt: Timestamp.now()
      };

      // Add increments if provided
      if (increments.lightScrapes) {
        updates.lightScrapesUsed = (usageSnap.data()?.lightScrapesUsed || 0) + increments.lightScrapes;
      }
      if (increments.deepScrapes) {
        updates.deepScrapesUsed = (usageSnap.data()?.deepScrapesUsed || 0) + increments.deepScrapes;
      }
      if (increments.aiGenerations) {
        updates.aiGenerations = (usageSnap.data()?.aiGenerations || 0) + increments.aiGenerations;
      }
      if (increments.smtpEmailsSent) {
        updates.smtpEmailsSent = (usageSnap.data()?.smtpEmailsSent || 0) + increments.smtpEmailsSent;
      }
      if (increments.sequencesUsed) {
        updates.sequencesUsed = (usageSnap.data()?.sequencesUsed || 0) + increments.sequencesUsed;
      }
      if (increments.templatesUsed) {
        updates.templatesUsed = (usageSnap.data()?.templatesUsed || 0) + increments.templatesUsed;
      }
      if (increments.imapSyncCount) {
        updates.imapSyncCount = (usageSnap.data()?.imapSyncCount || 0) + increments.imapSyncCount;
      }

      // Set reset date if creating new document
      if (!usageSnap.exists) {
        const nextMonth = new Date();
        nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1, 1);
        nextMonth.setUTCHours(0, 0, 0, 0);
        updates.resetDate = Timestamp.fromDate(nextMonth);
      }

      // Write usage document
      transaction.set(usageRef, updates, { merge: true });

      // Update SMTP daily counter if needed
      if (smtpDailyRef && increments.smtpEmailsSent) {
        const smtpDailySnap = await transaction.get(smtpDailyRef);
        const currentDailyCount = smtpDailySnap.exists
          ? smtpDailySnap.data()?.emailsSent || 0
          : 0;

        transaction.set(
          smtpDailyRef,
          {
            date: today,
            emailsSent: currentDailyCount + increments.smtpEmailsSent,
            updatedAt: Timestamp.now(),
            ...(smtpDailySnap.exists ? {} : { createdAt: Timestamp.now() })
          },
          { merge: true }
        );
      }
    });

    console.log(
      `[chargeCreditsAtomic] Successfully charged ${deltaCredits} credits for user ${userId} (month: ${monthId})`
    );
  } catch (error: any) {
    console.error(`[chargeCreditsAtomic] Transaction failed for user ${userId}:`, error);
    throw error;
  }
}
