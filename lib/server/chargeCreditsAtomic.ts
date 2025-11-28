import { adminDB } from "@/lib/firebase-admin";
import { UsageIncrements } from "@/lib/types/plans";
import { Timestamp } from "firebase-admin/firestore";

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
 * @param cycleId - Billing Cycle ID (YYYY-MM-DD format)
 * @param deltaCredits - Credits to deduct
 * @param increments - Usage counters to increment
 * @param verifyLimit - Optional plan credit limit to verify before charging
 * @returns Success boolean
 * @throws Error if transaction fails or limit would be exceeded
 */
export async function chargeCreditsAtomic(
  userId: string,
  cycleId: string,
  deltaCredits: number,
  increments: UsageIncrements,
  limits?: {
    creditLimit?: number;
    lightScrapeLimit?: number;
    deepScrapeLimit?: number;
    sequenceLimit?: number;
    templateLimit?: number;
    smtpDailyLimit?: number;
  }
): Promise<void> {
  const usageRef = adminDB
    .collection("users")
    .doc(userId)
    .collection("usage")
    .doc(cycleId);

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
      let usageData: any = {};

      if (usageSnap.exists) {
        usageData = usageSnap.data() || {};
        currentCreditsUsed = usageData.creditsUsed || 0;
      }

      // 1. Verify Credit Limit
      if (limits?.creditLimit !== undefined) {
        const newCreditsUsed = currentCreditsUsed + deltaCredits;
        if (newCreditsUsed > limits.creditLimit) {
          throw new Error(
            `INSUFFICIENT_CREDITS: Would exceed limit (${newCreditsUsed}/${limits.creditLimit})`
          );
        }
      }

      // 2. Verify Feature Limits (Monthly)
      if (limits?.lightScrapeLimit !== undefined && increments.lightScrapes) {
        const current = usageData.lightScrapesUsed || 0;
        if (current >= limits.lightScrapeLimit) {
           throw new Error("SCRAPER_LIMIT_REACHED");
        }
      }
      if (limits?.deepScrapeLimit !== undefined && increments.deepScrapes) {
        const current = usageData.deepScrapesUsed || 0;
        if (current >= limits.deepScrapeLimit) {
           throw new Error("SCRAPER_LIMIT_REACHED");
        }
      }
      if (limits?.sequenceLimit !== undefined && increments.sequencesUsed) {
        const current = usageData.sequencesUsed || 0;
        if (current >= limits.sequenceLimit) {
           throw new Error("SEQUENCE_LIMIT");
        }
      }
      if (limits?.templateLimit !== undefined && increments.templatesUsed) {
        const current = usageData.templatesUsed || 0;
        if (current >= limits.templateLimit) {
           throw new Error("TEMPLATE_LIMIT");
        }
      }

      // 3. Verify SMTP Daily Limit
      if (smtpDailyRef && increments.smtpEmailsSent) {
        const smtpDailySnap = await transaction.get(smtpDailyRef);
        const currentDailyCount = smtpDailySnap.exists
          ? smtpDailySnap.data()?.emailsSent || 0
          : 0;
        
        if (limits?.smtpDailyLimit !== undefined) {
            if (currentDailyCount >= limits.smtpDailyLimit) {
                throw new Error("SMTP_DAILY_LIMIT");
            }
        }

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

      // Prepare usage updates
      const updates: any = {
        monthId: cycleId, // keeping field name 'monthId' for compatibility, but storing cycleId
        creditsUsed: (usageSnap.exists ? currentCreditsUsed : 0) + deltaCredits,
        updatedAt: Timestamp.now()
      };

      // Add increments if provided
      if (increments.lightScrapes) {
        updates.lightScrapesUsed = (usageData.lightScrapesUsed || 0) + increments.lightScrapes;
      }
      if (increments.deepScrapes) {
        updates.deepScrapesUsed = (usageData.deepScrapesUsed || 0) + increments.deepScrapes;
      }
      if (increments.aiGenerations) {
        updates.aiGenerations = (usageData.aiGenerations || 0) + increments.aiGenerations;
      }
      if (increments.smtpEmailsSent) {
        updates.smtpEmailsSent = (usageData.smtpEmailsSent || 0) + increments.smtpEmailsSent;
      }
      if (increments.sequencesUsed) {
        updates.sequencesUsed = (usageData.sequencesUsed || 0) + increments.sequencesUsed;
      }
      if (increments.templatesUsed) {
        updates.templatesUsed = (usageData.templatesUsed || 0) + increments.templatesUsed;
      }
      if (increments.imapSyncCount) {
        updates.imapSyncCount = (usageData.imapSyncCount || 0) + increments.imapSyncCount;
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
    });

    console.log(
      `[chargeCreditsAtomic] Successfully charged ${deltaCredits} credits for user ${userId} (cycle: ${cycleId})`
    );
  } catch (error: any) {
    console.error(`[chargeCreditsAtomic] Transaction failed for user ${userId}:`, error);
    throw error;
  }
}
