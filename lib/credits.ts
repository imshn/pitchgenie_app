import { adminDB } from "./firebase-admin";
import {
  PlanType,
  ActionType,
  PLAN_CONFIGS,
  CREDIT_COSTS,
  UserCreditData,
} from "./credit-types";

// Re-export types for convenience
export type { PlanType, ActionType, UserCreditData };
export { PLAN_CONFIGS, CREDIT_COSTS };

/**
 * Initialize credit fields for a new user
 */
export function getDefaultCreditData(): UserCreditData {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  
  return {
    plan: "free",
    credits: 50,
    maxCredits: 50,
    monthlyCredits: 50,
    scraperLimit: 3,
    scraperUsed: 0,
    nextReset: now + thirtyDays,
    planUpdatedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Reset monthly credits if the reset date has passed
 */
export async function resetMonthlyCredits(uid: string): Promise<void> {
  const userRef = adminDB.collection("users").doc(uid);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    throw new Error("User not found");
  }
  
  const userData = userDoc.data() as UserCreditData;
  const now = Date.now();
  
  // Check if reset is needed
  if (userData.nextReset && userData.nextReset < now) {
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    await userRef.update({
      credits: userData.maxCredits,
      scraperUsed: 0,
      nextReset: now + thirtyDays,
      updatedAt: now,
    });
    
    console.log(`[Credits] Monthly reset completed for user ${uid}`);
  }
}

/**
 * Check if user has enough credits for an action
 * Also triggers monthly reset if needed
 */
export async function checkCredits(
  uid: string,
  actionType: ActionType
): Promise<{ ok: boolean; error?: string; credits?: number }> {
  try {
    // First, check and perform monthly reset if needed
    await resetMonthlyCredits(uid);
    
    const userRef = adminDB.collection("users").doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return { ok: false, error: "USER_NOT_FOUND" };
    }
    
    const userData = userDoc.data() as UserCreditData;
    const cost = CREDIT_COSTS[actionType];
    
    // Agency plan has unlimited credits
    if (userData.plan === "agency") {
      return { ok: true, credits: Infinity };
    }
    
    // Special handling for scrapers on free plan
    if (actionType === "scraper" && userData.plan === "free") {
      if (userData.scraperUsed >= userData.scraperLimit) {
        return { 
          ok: false, 
          error: "SCRAPER_LIMIT_REACHED",
          credits: userData.credits 
        };
      }
      return { ok: true, credits: userData.credits };
    }
    
    // Check if user has enough credits
    if (userData.credits < cost) {
      return { 
        ok: false, 
        error: "INSUFFICIENT_CREDITS",
        credits: userData.credits 
      };
    }
    
    return { ok: true, credits: userData.credits };
  } catch (error) {
    console.error("[Credits] Check error:", error);
    return { ok: false, error: "SYSTEM_ERROR" };
  }
}

/**
 * Deduct credits from user account
 */
export async function deductCredits(
  uid: string,
  actionType: ActionType
): Promise<{ success: boolean; credits: number; error?: string }> {
  try {
    const userRef = adminDB.collection("users").doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return { success: false, credits: 0, error: "USER_NOT_FOUND" };
    }
    
    const userData = userDoc.data() as UserCreditData;
    const cost = CREDIT_COSTS[actionType];
    const now = Date.now();
    
    // Agency plan - no deduction
    if (userData.plan === "agency") {
      // Log event but don't deduct
      await userRef.collection("events").add({
        type: "credits_deducted",
        actionType,
        cost: 0,
        timestamp: now,
      });
      return { success: true, credits: Infinity };
    }
    
    // Free plan scraper - increment scraperUsed instead of deducting credits
    if (actionType === "scraper" && userData.plan === "free") {
      const newScraperUsed = (userData.scraperUsed || 0) + 1;
      
      await userRef.update({
        scraperUsed: newScraperUsed,
        updatedAt: now,
      });
      
      // Log event
      await userRef.collection("events").add({
        type: "scraper_used",
        count: newScraperUsed,
        limit: userData.scraperLimit,
        timestamp: now,
      });
      
      return { success: true, credits: userData.credits };
    }
    
    // Deduct credits for paid plans or non-scraper actions
    const newCredits = userData.credits - cost;
    
    if (newCredits < 0) {
      return { success: false, credits: userData.credits, error: "INSUFFICIENT_CREDITS" };
    }
    
    await userRef.update({
      credits: newCredits,
      updatedAt: now,
    });
    
    // Log analytics event
    await userRef.collection("events").add({
      type: "credits_deducted",
      actionType,
      cost,
      timestamp: now,
      creditsRemaining: newCredits,
    });
    
    console.log(`[Credits] Deducted ${cost} credits from ${uid}. Remaining: ${newCredits}`);
    
    return { success: true, credits: newCredits };
  } catch (error) {
    console.error("[Credits] Deduction error:", error);
    return { success: false, credits: 0, error: "SYSTEM_ERROR" };
  }
}

/**
 * Update user's plan and reset credits
 */
export async function updateUserPlan(
  uid: string,
  newPlan: PlanType
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = adminDB.collection("users").doc(uid);
    const planConfig = PLAN_CONFIGS[newPlan];
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    await userRef.update({
      plan: newPlan,
      credits: planConfig.credits,
      maxCredits: planConfig.maxCredits,
      monthlyCredits: planConfig.monthlyCredits,
      scraperLimit: planConfig.scraperLimit,
      scraperUsed: 0,
      nextReset: now + thirtyDays,
      planUpdatedAt: now,
      updatedAt: now,
    });
    
    // Log plan change event
    await userRef.collection("events").add({
      type: "plan_updated",
      newPlan,
      timestamp: now,
    });
    
    console.log(`[Credits] Updated plan for ${uid} to ${newPlan}`);
    
    return { success: true };
  } catch (error) {
    console.error("[Credits] Plan update error:", error);
    return { success: false, error: "SYSTEM_ERROR" };
  }
}
