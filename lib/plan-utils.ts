
import { adminDB } from "./firebase-admin";
import { PlanType } from "./credit-types";

export interface PlanData {
  name: string;
  priceMonthly: number;
  priceYearly: number;
  memberLimit: number;
  creditLimit: number;
  scraperLimit: number | "unlimited";
  deepScraper: boolean;
  sequenceLimit: number;
  templateLimit: number;
  aiToneModes: number;
  smtpSendLimit: number;
  features: string[];
  tagColor: string;
  badge: string | null;
}

export interface UsageData {
  creditsUsed: number;
  scraperUsed: number;
  sequencesUsed: number;
  templatesUsed: number;
  smtpEmailsSent: number;
  aiToneUsed: number;
  resetDate: number;
  updatedAt: number;
}

export interface UserProfile {
  displayName: string;
  email: string;
  company?: {
    name?: string;
    website?: string;
    industry?: string;
    size?: string;
    services?: string[];
  };
  persona?: string;
  pitchTone?: string;
}

export interface EffectivePlan {
  userId: string;
  workspaceId: string | null;
  planType: PlanType;
  planData: PlanData;
  usage: UsageData;
  remaining: {
    credits: number;
    scraper: number | "unlimited";
    sequences: number;
    templates: number;
    smtp: number;
  };
  profile: UserProfile | null;
  canScrapeDeep: boolean;
}

/**
 * Get the effective plan for a user, including usage and profile.
 * Prioritizes Workspace Mode for billing/usage.
 */
export async function getUserPlan(userId: string): Promise<EffectivePlan> {
  // 1. Fetch User & Profile
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
    const freePlanData = freePlanSnap.exists ? (freePlanSnap.data() as PlanData) : {
      name: "Free", priceMonthly: 0, priceYearly: 0, memberLimit: 2, creditLimit: 50,
      scraperLimit: 3, deepScraper: false, sequenceLimit: 1, templateLimit: 3,
      aiToneModes: 2, smtpSendLimit: 20, features: [], tagColor: "gray", badge: null
    };

    return {
      userId,
      workspaceId: null,
      planType: "free",
      planData: freePlanData,
      usage: {
        creditsUsed: 0, scraperUsed: 0, sequencesUsed: 0, templatesUsed: 0,
        smtpEmailsSent: 0, aiToneUsed: 0, resetDate: Date.now(), updatedAt: Date.now()
      },
      remaining: {
        credits: freePlanData.creditLimit,
        scraper: freePlanData.scraperLimit,
        sequences: freePlanData.sequenceLimit,
        templates: freePlanData.templateLimit,
        smtp: freePlanData.smtpSendLimit,
      },
      profile: null,
      canScrapeDeep: false
    };
  }

  const userData = userSnap.data()!;
  const workspaceId = userData.currentWorkspaceId || null;
  const profile = profileSnap.exists ? (profileSnap.data() as UserProfile) : null;

  // 2. Determine Plan Source (Workspace or User)
  // In Workspace Mode, we check the workspace's plan
  let planType: PlanType = "free";
  
  if (workspaceId) {
    const workspaceSnap = await adminDB.collection("workspaces").doc(workspaceId).get();
    if (workspaceSnap.exists) {
      const wsData = workspaceSnap.data()!;
      planType = (wsData.planId as PlanType) || "free";
    }
  } else {
    // Fallback to user plan if no workspace (though app is workspace-based)
    planType = (userData.planType as PlanType) || "free";
  }

  // 3. Fetch Plan Metadata
  const planSnap = await adminDB.collection("plans").doc(planType).get();
  // Fallback to free plan defaults if plan doc missing (safety)
  const defaultPlan: PlanData = {
      name: "Free", priceMonthly: 0, priceYearly: 0, memberLimit: 2, creditLimit: 50, 
      scraperLimit: 3, deepScraper: false, sequenceLimit: 1, templateLimit: 3, 
      aiToneModes: 2, smtpSendLimit: 20, features: [], tagColor: "gray", badge: null
  };
  const planData = planSnap.exists ? (planSnap.data() as PlanData) : defaultPlan;

  // 4. Fetch Usage (Workspace Level)
  let usage: UsageData = {
    creditsUsed: 0, scraperUsed: 0, sequencesUsed: 0, templatesUsed: 0, 
    smtpEmailsSent: 0, aiToneUsed: 0, resetDate: Date.now(), updatedAt: Date.now()
  };

  if (workspaceId) {
    const date = new Date();
    const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const usageSnap = await adminDB
      .collection("workspaces")
      .doc(workspaceId)
      .collection("usage")
      .doc(monthId)
      .get();

    if (usageSnap.exists) {
      usage = { ...usage, ...usageSnap.data() } as UsageData;
    }
  }

  // 5. Calculate Remaining
  const remaining = {
    credits: Math.max(0, planData.creditLimit - usage.creditsUsed),
    scraper: planData.scraperLimit === "unlimited" ? "unlimited" : Math.max(0, (planData.scraperLimit as number) - usage.scraperUsed),
    sequences: Math.max(0, planData.sequenceLimit - usage.sequencesUsed),
    templates: Math.max(0, planData.templateLimit - usage.templatesUsed),
    smtp: Math.max(0, planData.smtpSendLimit - usage.smtpEmailsSent),
  };

  return {
    userId,
    workspaceId,
    planType,
    planData,
    usage,
    remaining: remaining as any,
    profile,
    canScrapeDeep: planData.deepScraper
  };
}

/**
 * Get plan and usage for a specific workspace.
 * Useful for backend operations where we only have workspaceId.
 */
export async function getWorkspacePlan(workspaceId: string): Promise<{
  planId: PlanType;
  planData: PlanData;
  usage: UsageData;
  remaining: EffectivePlan['remaining'];
}> {
  // 1. Fetch Workspace
  const workspaceSnap = await adminDB.collection("workspaces").doc(workspaceId).get();
  if (!workspaceSnap.exists) {
    throw new Error("Workspace not found");
  }
  const wsData = workspaceSnap.data()!;
  const planId = (wsData.planId as PlanType) || "free";

  // 2. Fetch Plan Metadata
  const planSnap = await adminDB.collection("plans").doc(planId).get();
  const defaultPlan: PlanData = {
      name: "Free", priceMonthly: 0, priceYearly: 0, memberLimit: 2, creditLimit: 50, 
      scraperLimit: 3, deepScraper: false, sequenceLimit: 1, templateLimit: 3, 
      aiToneModes: 2, smtpSendLimit: 20, features: [], tagColor: "gray", badge: null
  };
  const planData = planSnap.exists ? (planSnap.data() as PlanData) : defaultPlan;

  // 3. Fetch Usage
  let usage: UsageData = {
    creditsUsed: 0, scraperUsed: 0, sequencesUsed: 0, templatesUsed: 0, 
    smtpEmailsSent: 0, aiToneUsed: 0, resetDate: Date.now(), updatedAt: Date.now()
  };

  const date = new Date();
  const monthId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const usageSnap = await adminDB
    .collection("workspaces")
    .doc(workspaceId)
    .collection("usage")
    .doc(monthId)
    .get();

  if (usageSnap.exists) {
    usage = { ...usage, ...usageSnap.data() } as UsageData;
  }

  // 4. Calculate Remaining
  const remaining = {
    credits: Math.max(0, planData.creditLimit - usage.creditsUsed),
    scraper: planData.scraperLimit === "unlimited" ? "unlimited" : Math.max(0, (planData.scraperLimit as number) - usage.scraperUsed),
    sequences: Math.max(0, planData.sequenceLimit - usage.sequencesUsed),
    templates: Math.max(0, planData.templateLimit - usage.templatesUsed),
    smtp: Math.max(0, planData.smtpSendLimit - usage.smtpEmailsSent),
  };

  return {
    planId,
    planData,
    usage,
    remaining: remaining as any
  };
}
