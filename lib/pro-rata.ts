/**
 * Pro-rata Credit Calculation
 * 
 * Calculates fair credit allocation when users upgrade mid-cycle
 */

import { PLAN_CONFIGS } from "./credit-types";
import type { PlanType } from "./credit-types";

/**
 * Calculate pro-rata credits for plan upgrade
 * 
 * Formula: (Days Remaining / 30) * New Plan Monthly Credits
 * 
 * @param currentPlan - Current user plan
 * @param newPlan - Plan being upgraded to
 * @param nextReset - Timestamp of next reset
 * @returns Pro-rated credit amount
 */
export function calculateProRataCredits(
  currentPlan: PlanType,
  newPlan: PlanType,
  nextReset: number
): number {
  const now = Date.now();
  
  // If no reset date or already passed, give full credits
  if (!nextReset || nextReset <= now) {
    return PLAN_CONFIGS[newPlan].monthlyCredits;
  }
  
  // Calculate days remaining in current cycle
  const daysRemaining = Math.ceil((nextReset - now) / (1000 * 60 * 60 * 24));
  const totalDays = 30;
  
  // If less than 1 day remaining, give full credits for next month
  if (daysRemaining < 1) {
    return PLAN_CONFIGS[newPlan].monthlyCredits;
  }
  
  // Calculate percentage of month remaining
  const percentage = Math.min(daysRemaining / totalDays, 1);
  
  // Get current remaining credits
  const newPlanMonthlyCredits = PLAN_CONFIGS[newPlan].monthlyCredits;
  
  // Calculate pro-rata credits (rounded up to be generous)
  const proRataCredits = Math.ceil(newPlanMonthlyCredits * percentage);
  
  console.log(`[Pro-rata] Upgrade ${currentPlan} → ${newPlan}:`);
  console.log(`  Days remaining: ${daysRemaining}/${totalDays}`);
  console.log(`  Percentage: ${(percentage * 100).toFixed(1)}%`);
  console.log(`  Pro-rata credits: ${proRataCredits}`);
  
  return proRataCredits;
}

/**
 * Calculate if upgrade gives immediate credit boost
 * 
 * @param currentCredits - Current credit balance
 * @param currentPlan - Current plan
 * @param newPlan - Upgrading to this plan
 * @param nextReset - Next reset timestamp
 * @returns Credit difference (positive = boost, negative = no change)
 */
export function calculateUpgradeBoost(
  currentCredits: number,
  currentPlan: PlanType,
  newPlan: PlanType,
  nextReset: number
): number {
  const proRataCredits = calculateProRataCredits(currentPlan, newPlan, nextReset);
  const boost = proRataCredits - currentCredits;
  
  return Math.max(boost, 0); // Never subtract on upgrade
}

/**
 * Get detailed upgrade preview
 */
export function getUpgradePreview(
  currentCredits: number,
  currentPlan: PlanType,
  newPlan: PlanType,
  nextReset: number
) {
  const proRataCredits = calculateProRataCredits(currentPlan, newPlan, nextReset);
  const boost = calculateUpgradeBoost(currentCredits, currentPlan, newPlan, nextReset);
  const daysRemaining = Math.ceil((nextReset - Date.now()) / (1000 * 60 * 60 * 24));
  
  return {
    currentCredits,
    proRataCredits,
    boost,
    daysRemaining,
    newPlanMonthlyCredits: PLAN_CONFIGS[newPlan].monthlyCredits,
  };
}
