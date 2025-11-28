import { adminDB } from "@/lib/firebase-admin";
import { PlanDocument, UserDocument, UserProfile, UsageDocument, MergedPlanData } from "@/lib/types/plans";
import { Timestamp } from "firebase-admin/firestore";


import { ensureBillingCycle } from "./billingCycle";

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
/**
 * Get SMTP daily usage for a specific date
 */
async function getSmtpDailyUsage(userId: string, dateId: string, workspaceId?: string | null): Promise<number> {
  try {
    let dailyRef;
    if (workspaceId) {
       dailyRef = adminDB.collection("workspaces").doc(workspaceId).collection("smtpDaily").doc(dateId);
    } else {
       dailyRef = adminDB.collection("users").doc(userId).collection("smtpDaily").doc(dateId);
    }

    const dailyDoc = await dailyRef.get();

    if (!dailyDoc.exists) {
      return 0;
    }

    const data = dailyDoc.data();
    return data?.emailsSent || 0;
  } catch (error) {
    console.error(`[getSmtpDailyUsage] Error fetching daily usage for ${workspaceId || userId}:`, error);
    return 0;
  }
}

/**
 * Get merged user plan data including plan metadata, usage, profile, and remaining limits
 * 
 * @param userId - Firebase user ID
 * @param cycleId - Optional cycle ID (YYYY-MM-DD). If not provided, fetches from user doc.
 * @returns Merged plan data with calculated remaining limits
 */
export async function getUserPlan(
  userId: string,
  cycleId?: string
): Promise<MergedPlanData> {
  const today = getCurrentDateId();

  try {
    // Fetch user document and profile in parallel
    const userRef = adminDB.collection("users").doc(userId);
    const profileRef = userRef.collection("profile").doc("main");

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
        memberLimit: 2,
        creditLimit: 50,
        scraperLightLimit: 5,
        scraperDeepLimit: 0,
        deepScraperEnabled: false,
        sequenceLimit: 1,
        templateLimit: 2,
        aiToneModes: 2,
        smtpDailyLimit: 20,
        imapSyncIntervalSeconds: null,
        integrations: { notion: true, slack: false, sheetsSync: true, zapier: false },
        features: [
          "50 monthly credits",
          "20 emails per day",
          "5 light scrapes",
          "1 sequence per month",
          "2 templates",
          "Email & LinkedIn generation",
          "Manual email sending",
          "Google Sheets & Notion integration"
        ],
        tagColor: "#9CA3AF",
        badge: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as PlanDocument;

      // Use today's cycle if not provided
      const tempCycleId = cycleId || getCurrentDateId();

      return {
        userId,
        billingUserId: userId,
        workspaceId: null,
        planType: "free",
        personalPlanType: "free",
        planData: freePlanData,
        usage: {
          monthId: tempCycleId,
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
    let workspaceId = userData.currentWorkspaceId || userData.workspaceId || null;
    let planType = userData.planType || "free";
    let billingUserId = userId;
    let currentCycleId = cycleId;
    let usageRef;
    let effectiveResetDate = userData.nextResetDate;

    // If in a workspace, override plan and usage source
    if (workspaceId) {
        const workspaceDoc = await adminDB.collection("workspaces").doc(workspaceId).get();
        if (workspaceDoc.exists) {
            const workspaceData = workspaceDoc.data();
            // Workspace Plan overrides Personal Plan
            planType = workspaceData?.planId || "free";
            billingUserId = workspaceData?.ownerUid || userId;
            
            // ALWAYS use Owner's Billing Cycle for Workspace
            // This ensures sync between Owner's personal usage (if migrated) and Workspace usage
            if (!currentCycleId) {
                currentCycleId = await ensureBillingCycle(billingUserId);
            }
            
            // Fetch Owner's reset date for display
            // We need to fetch the owner's doc to get the accurate nextResetDate (updated by ensureBillingCycle)
            const ownerDoc = await adminDB.collection("users").doc(billingUserId).get();
            effectiveResetDate = ownerDoc.data()?.nextResetDate;
            
            // Usage is tracked at Workspace level
            usageRef = adminDB.collection("workspaces").doc(workspaceId).collection("usage").doc(currentCycleId);
        } else {
            workspaceId = null;
        }
    }

    // If no workspace or cycle not set, use Personal Billing Cycle
    if (!currentCycleId) {
        currentCycleId = await ensureBillingCycle(userId);
        // Refresh reset date from user doc (since ensureBillingCycle might have updated it)
        const updatedUserDoc = await adminDB.collection("users").doc(userId).get();
        effectiveResetDate = updatedUserDoc.data()?.nextResetDate;
    }
    
    if (!usageRef) {
         usageRef = adminDB.collection("users").doc(userId).collection("usage").doc(currentCycleId);
    }

    // Fetch plan document and usage in parallel
    const planRef = adminDB.collection("plans").doc(planType);

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
    let usage: UsageDocument = usageSnap.exists
      ? (usageSnap.data() as UsageDocument)
      : {
          monthId: currentCycleId,
          creditsUsed: 0,
          lightScrapesUsed: 0,
          deepScrapesUsed: 0,
          sequencesUsed: 0,
          templatesUsed: 0,
          smtpEmailsSent: 0,
          aiGenerations: 0,
          imapSyncCount: 0,
          resetDate: effectiveResetDate || Timestamp.now(),
          updatedAt: Timestamp.now()
        };

    // Lazy Migration: If workspace usage is empty/unmigrated, try to copy from Owner's personal usage
    if (workspaceId && (!usageSnap.exists || !(usageSnap.data() as any).migrated)) {
        try {
            const ownerUsageRef = adminDB.collection("users").doc(billingUserId).collection("usage").doc(currentCycleId);
            const ownerUsageSnap = await ownerUsageRef.get();
            
            if (ownerUsageSnap.exists) {
                const ownerUsage = ownerUsageSnap.data() as UsageDocument;
                // Only migrate if owner has meaningful usage
                if (ownerUsage.creditsUsed > 0 || ownerUsage.smtpEmailsSent > 0 || ownerUsage.lightScrapesUsed > 0) {
                    console.log(`[getUserPlan] Migrating usage from User ${billingUserId} to Workspace ${workspaceId}`);
                    
                    const migratedUsage = {
                        ...ownerUsage,
                        migrated: true,
                        updatedAt: Timestamp.now()
                    };
                    
                    // Write to workspace usage
                    await usageRef.set(migratedUsage, { merge: true });
                    
                    // Update local usage variable to reflect migration immediately
                    usage = migratedUsage as unknown as UsageDocument;
                } else {
                    // Mark as migrated to prevent future checks
                    await usageRef.set({ migrated: true }, { merge: true });
                }
            }
        } catch (migrationError) {
            console.error("[getUserPlan] Migration failed:", migrationError);
            // Continue with empty usage, don't block
        }
    }

    // Get profile data if exists (of the Calling User)
    let profile: UserProfile | null = null;
    if (profileSnap.exists) {
        const data = profileSnap.data() || {};
        
        // Construct company object from flat fields if needed
        const companyObj = data.company && typeof data.company === 'object' ? data.company : {
            name: data.company || data.companyName,
            website: data.website || data.companyWebsite,
            about: data.companyDescription,
            location: data.companyLocation,
            services: data.services || data.servicesOffered
        };

        profile = {
            ...data,
            displayName: data.fullName || data.name || data.displayName || "",
            email: data.email || userData.email || "",
            company: companyObj,
            persona: data.persona || data.personaTone,
            timezone: data.timezone || "UTC",
            language: data.language || "en",
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt || Timestamp.now()
        } as UserProfile;
    }

    // Get SMTP daily usage for today (Workspace or User level)
    const smtpDailyUsed = await getSmtpDailyUsage(userId, today, workspaceId);

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
      billingUserId,
      workspaceId,
      planType,
      personalPlanType: userData.planType || "free",
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
