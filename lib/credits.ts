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
 * Initialize credit fields for a new workspace
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
export async function resetMonthlyCredits(workspaceId: string): Promise<void> {
  const workspaceRef = adminDB.collection("workspaces").doc(workspaceId);
  const workspaceDoc = await workspaceRef.get();
  
  if (!workspaceDoc.exists) {
    throw new Error("Workspace not found");
  }
  
  const workspaceData = workspaceDoc.data() as UserCreditData;
  const now = Date.now();
  
  // Check if reset is needed
  if (workspaceData.nextReset && workspaceData.nextReset < now) {
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    await workspaceRef.update({
      credits: workspaceData.maxCredits,
      scraperUsed: 0,
      nextReset: now + thirtyDays,
      updatedAt: now,
    });
    
    console.log(`[Credits] Monthly reset completed for workspace ${workspaceId}`);
  }
}

/**
 * Check if workspace has enough credits for an action
 * Also triggers monthly reset if needed
 */
export async function checkCredits(
  workspaceId: string,
  actionType: ActionType
): Promise<{ ok: boolean; error?: string; credits?: number }> {
  try {
    // First, check and perform monthly reset if needed
    await resetMonthlyCredits(workspaceId);
    
    const workspaceRef = adminDB.collection("workspaces").doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();
    
    if (!workspaceDoc.exists) {
      return { ok: false, error: "WORKSPACE_NOT_FOUND" };
    }
    
    const workspaceData = workspaceDoc.data() as UserCreditData;
    const cost = CREDIT_COSTS[actionType];
    
    // Agency plan has unlimited credits
    if (workspaceData.plan === "agency") {
      return { ok: true, credits: Infinity };
    }
    
    // Special handling for scrapers on free plan
    if (actionType === "scraper" && workspaceData.plan === "free") {
      if ((workspaceData.scraperUsed || 0) >= (workspaceData.scraperLimit || 3)) {
        return { 
          ok: false, 
          error: "SCRAPER_LIMIT_REACHED",
          credits: workspaceData.credits 
        };
      }
      return { ok: true, credits: workspaceData.credits };
    }
    
    // Check if user has enough credits
    if (workspaceData.credits < cost) {
      return { 
        ok: false, 
        error: "INSUFFICIENT_CREDITS",
        credits: workspaceData.credits 
      };
    }
    
    return { ok: true, credits: workspaceData.credits };
  } catch (error) {
    console.error("[Credits] Check error:", error);
    return { ok: false, error: "SYSTEM_ERROR" };
  }
}

/**
 * Deduct credits from workspace account
 */
export async function deductCredits(
  workspaceId: string,
  actionType: ActionType
): Promise<{ success: boolean; credits: number; error?: string }> {
  try {
    const workspaceRef = adminDB.collection("workspaces").doc(workspaceId);
    const workspaceDoc = await workspaceRef.get();
    
    if (!workspaceDoc.exists) {
      return { success: false, credits: 0, error: "WORKSPACE_NOT_FOUND" };
    }
    
    const workspaceData = workspaceDoc.data() as UserCreditData;
    const cost = CREDIT_COSTS[actionType];
    const now = Date.now();
    
    // Agency plan - no deduction
    if (workspaceData.plan === "agency") {
      // Log event but don't deduct
      await workspaceRef.collection("events").add({
        type: "credits_deducted",
        actionType,
        cost: 0,
        timestamp: now,
      });
      return { success: true, credits: Infinity };
    }
    
    // Free plan scraper - increment scraperUsed instead of deducting credits
    if (actionType === "scraper" && workspaceData.plan === "free") {
      const newScraperUsed = (workspaceData.scraperUsed || 0) + 1;
      
      await workspaceRef.update({
        scraperUsed: newScraperUsed,
        updatedAt: now,
      });
      
      // Log event
      await workspaceRef.collection("events").add({
        type: "scraper_used",
        count: newScraperUsed,
        limit: workspaceData.scraperLimit,
        timestamp: now,
      });
      
      return { success: true, credits: workspaceData.credits };
    }
    
    // Deduct credits for paid plans or non-scraper actions
    const newCredits = workspaceData.credits - cost;
    
    if (newCredits < 0) {
      return { success: false, credits: workspaceData.credits, error: "INSUFFICIENT_CREDITS" };
    }
    
    await workspaceRef.update({
      credits: newCredits,
      updatedAt: now,
    });
    
    // Log analytics event
    await workspaceRef.collection("events").add({
      type: "credits_deducted",
      actionType,
      cost,
      timestamp: now,
      creditsRemaining: newCredits,
    });
    
    console.log(`[Credits] Deducted ${cost} credits from workspace ${workspaceId}. Remaining: ${newCredits}`);
    
    return { success: true, credits: newCredits };
  } catch (error) {
    console.error("[Credits] Deduction error:", error);
    return { success: false, credits: 0, error: "SYSTEM_ERROR" };
  }
}

/**
 * Update workspace's plan and reset credits
 */
export async function updateWorkspacePlan(
  workspaceId: string,
  newPlan: PlanType
): Promise<{ success: boolean; error?: string }> {
  try {
    const workspaceRef = adminDB.collection("workspaces").doc(workspaceId);
    const planConfig = PLAN_CONFIGS[newPlan];
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    await workspaceRef.update({
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
    await workspaceRef.collection("events").add({
      type: "plan_updated",
      newPlan,
      timestamp: now,
    });
    
    console.log(`[Credits] Updated plan for workspace ${workspaceId} to ${newPlan}`);
    
    return { success: true };
  } catch (error) {
    console.error("[Credits] Plan update error:", error);
    return { success: false, error: "SYSTEM_ERROR" };
  }
}
