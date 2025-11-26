import { adminDB } from "@/lib/firebase-admin";
import { PlanDocument, UserDocument, UserProfile, UsageDocument, MergedPlanData } from "@/lib/types/plans";
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
 * Get SMTP daily usage for a specific date
 */
async function getSmtpDailyUsage(userId: string, dateId: string): Promise<number> {
  try {
    const dailyDoc = await adminDB
      .collection("users")
      .doc(userId)
      .collection("smtpDaily")
      .doc(dateId)
      .get();

    if (!dailyDoc.exists) {
      return 0;
    }

    const data = dailyDoc.data();
    return data?.emailsSent || 0;
  } catch (error) {
    console.error(`[getSmtpDailyUsage] Error fetching daily usage for ${userId}:`, error);
    return 0;
  }
}

/**
 * Get merged user plan data including plan metadata, usage, profile, and remaining limits
 * 
 * @param userId - Firebase user ID
 * @param monthId - Optional month ID (defaults to current month YYYY-MM)
 * @returns Merged plan data with calculated remaining limits
 */
export async function getUserPlan(
  userId: string,
  monthId?: string
): Promise<MergedPlanData> {
  const month = monthId || getCurrentMonthId();
  const today = getCurrentDateId();

  try {
    // Fetch user document and profile in parallel
    const userRef = adminDB.collection("users").doc(userId);
    const profileRef = userRef.collection("profile").doc("profile");

    const [userSnap, profileSnap] = await Promise.all([
      userRef.get(),
      profileRef.get()
    ]);

    // If user doesn't exist, return default Free plan (new signup)
    if (!userSnap.exists) {
      console.warn(`[getUserPlan] User ${userId} not found, returning default Free plan`);
      const freePlanSnap = await adminDB.collection("plans").doc("free").get();
      const freePlanData = freePlanSnap.exists ? (freePlanSnap.data() as PlanDocument) : {
        id: "free",
        name: "Free",
        priceMonthly: 0,
        priceYearly: 0,
        memberLimit: 1,
        creditLimit: 50,
        scraperLightLimit: 5,
        scraperDeepLimit: 0,
        deepScraperEnabled: false,
        sequenceLimit: 1,
        templateLimit: 2,
        aiToneModes: 2,
        smtpDailyLimit: 20,
        imapSyncIntervalSeconds: null,
        integrations: { notion: false, slack: false, sheetsSync: false, zapier: false },
        features: [],
        tagColor: "#9CA3AF",
        badge: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as PlanDocument;

      return {
        userId,
        workspaceId: null,
        planType: "free",
        planData: freePlanData,
        usage: {
          monthId: month,
          creditsUsed: 0,
          lightScrapesUsed: 0,
          deepScrapesUsed: 0,
          sequencesUsed: 0,
          templatesUsed: 0,
          smtpEmailsSent: 0,
          aiGenerations: 0,
          imapSyncCount: 0,
          resetDate: Timestamp.now(),
          updatedAt: Timestamp.now()
        },
        profile: null,
        remaining: {
          credits: freePlanData.creditLimit,
          lightScrapes: freePlanData.scraperLightLimit,
          deepScrapes: freePlanData.scraperDeepLimit,
          sequences: freePlanData.sequenceLimit,
          templates: freePlanData.templateLimit,
          smtpDailyRemaining: freePlanData.smtpDailyLimit,
        },
        canScrapeDeep: false
      };
    }

    const userData = userSnap.data() as UserDocument;
    const planType = userData.planType || "free";

    // Fetch plan document and usage in parallel
    const planRef = adminDB.collection("plans").doc(planType);
    const usageRef = userRef.collection("usage").doc(month);

    const [planSnap, usageSnap] = await Promise.all([
      planRef.get(),
      usageRef.get()
    ]);

    // Get plan data or use default free plan
    if (!planSnap.exists) {
      throw new Error(`Plan ${planType} not found in /plans collection`);
    }

    const planData = planSnap.data() as PlanDocument;

    // Get usage data or default to zeros
    const usage: UsageDocument = usageSnap.exists
      ? (usageSnap.data() as UsageDocument)
      : {
          monthId: month,
          creditsUsed: 0,
          lightScrapesUsed: 0,
          deepScrapesUsed: 0,
          sequencesUsed: 0,
          templatesUsed: 0,
          smtpEmailsSent: 0,
          aiGenerations: 0,
          imapSyncCount: 0,
          resetDate: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

    // Get profile data if exists
    const profile: UserProfile | null = profileSnap.exists
      ? (profileSnap.data() as UserProfile)
      : null;

    // Get SMTP daily usage for today
    const smtpDailyUsed = await getSmtpDailyUsage(userId, today);

    // Calculate remaining limits
    const remaining = {
      credits: Math.max(0, planData.creditLimit - usage.creditsUsed),
      lightScrapes: Math.max(0, planData.scraperLightLimit - usage.lightScrapesUsed),
      deepScrapes: Math.max(0, planData.scraperDeepLimit - usage.deepScrapesUsed),
      sequences: Math.max(0, planData.sequenceLimit - usage.sequencesUsed),
      templates: Math.max(0, planData.templateLimit - usage.templatesUsed),
      smtpDailyRemaining: Math.max(0, planData.smtpDailyLimit - smtpDailyUsed),
    };

    return {
      userId,
      workspaceId: userData.workspaceId || null,
      planType,
      planData,
      usage,
      profile,
      remaining,
      canScrapeDeep: planData.deepScraperEnabled
    };

  } catch (error) {
    console.error(`[getUserPlan] Error fetching plan data for user ${userId}:`, error);
    throw error;
  }
}
