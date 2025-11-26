import { adminDB, FieldValue } from "./firebase-admin";
import { getWorkspacePlan } from "./plan-utils"; // We might need to export a workspace helper from plan-utils
import { Plan } from "@/types/billing";

export type ActionType = "email" | "linkedin" | "sequence" | "scraper" | "deliverability";

// Credit costs per action
export const CREDIT_COSTS: Record<ActionType, number> = {
  email: 1,
  linkedin: 1,
  sequence: 3,
  scraper: 5,
  deliverability: 1,
};

/**
 * Check if workspace has enough credits for an action
 */
export async function checkCredits(
  workspaceId: string,
  actionType: ActionType
): Promise<{ ok: boolean; error?: string; credits?: number }> {
  try {
    // Fetch Plan & Usage
    const workspaceDoc = await adminDB.collection("workspaces").doc(workspaceId).get();
    if (!workspaceDoc.exists) throw new Error("Workspace not found");
    
    const planId = workspaceDoc.data()?.planId || "free";
    const planDoc = await adminDB.collection("plans").doc(planId).get();
    const planData = planDoc.data() as Plan;

    const date = new Date();
    const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const usageDoc = await adminDB.collection("workspaces").doc(workspaceId).collection("usage").doc(monthId).get();
    const usage = usageDoc.data() || { creditsUsed: 0, scraperUsed: 0 };

    const cost = CREDIT_COSTS[actionType];
    const creditsUsed = usage.creditsUsed || 0;
    const creditLimit = planData.creditLimit;

    // Agency plan has unlimited credits
    if (planId === "agency") {
      return { ok: true, credits: Infinity };
    }
    
    // Check Scraper Limit specifically
    if (actionType === "scraper") {
      const scraperLimit = planData.scraperLimit;
      const scraperUsed = usage.scraperUsed || 0;
      
      if (scraperLimit !== -1 && scraperUsed >= scraperLimit) {
         return { 
          ok: false, 
          error: "SCRAPER_LIMIT_REACHED",
          credits: creditLimit - creditsUsed
        };
      }
    }
    
    // Check Credits
    if (creditLimit !== -1 && (creditsUsed + cost) > creditLimit) {
      return { 
        ok: false, 
        error: "INSUFFICIENT_CREDITS",
        credits: creditLimit - creditsUsed
      };
    }
    
    return { ok: true, credits: creditLimit - creditsUsed };
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
    const cost = CREDIT_COSTS[actionType];
    const date = new Date();
    const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const usageRef = adminDB.collection("workspaces").doc(workspaceId).collection("usage").doc(monthId);

    await adminDB.runTransaction(async (t) => {
        const doc = await t.get(usageRef);
        if (!doc.exists) {
            t.set(usageRef, {
                creditsUsed: cost,
                scraperUsed: actionType === "scraper" ? 1 : 0,
                sequencesUsed: actionType === "sequence" ? 1 : 0,
                updatedAt: Date.now(),
                resetDate: Date.now() // approximate
            });
        } else {
            const updates: any = {
                creditsUsed: FieldValue.increment(cost),
                updatedAt: Date.now()
            };
            
            if (actionType === "scraper") {
                updates.scraperUsed = FieldValue.increment(1);
            }
            if (actionType === "sequence") {
                updates.sequencesUsed = FieldValue.increment(1);
            }
            
            t.update(usageRef, updates);
        }
    });
    
    // Log analytics event
    await adminDB.collection("workspaces").doc(workspaceId).collection("usage_logs").add({
      type: "credits_deducted",
      actionType,
      cost,
      timestamp: Date.now(),
    });
    
    return { success: true, credits: 0 }; // We don't return exact remaining here to save a read, or we could.
  } catch (error) {
    console.error("[Credits] Deduction error:", error);
    return { success: false, credits: 0, error: "SYSTEM_ERROR" };
  }
}

/**
 * Update workspace's plan
 * (This is largely handled by webhook now, but keeping for manual admin/testing)
 */
export async function updateWorkspacePlan(
  workspaceId: string,
  newPlanId: "free" | "starter" | "pro" | "agency"
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDB.collection("workspaces").doc(workspaceId).update({
      planId: newPlanId,
      updatedAt: Date.now(),
    });
    return { success: true };
  } catch (error) {
    console.error("[Credits] Plan update error:", error);
    return { success: false, error: "SYSTEM_ERROR" };
  }
}
