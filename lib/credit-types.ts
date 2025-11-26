// Plan type definition
export type PlanType = "free" | "starter" | "pro" | "agency";

// Action type definition
export type ActionType = "email" | "linkedin" | "sequence" | "scraper" | "deliverability";

// Plan configuration
export const PLAN_CONFIGS = {
  free: {
    name: "Free",
    credits: 50,
    maxCredits: 50,
    monthlyCredits: 50,
    scraperLimit: 3,
    sequenceLimit: 1,
    templateLimit: 3,
    memberLimit: 2,
    toneLimit: 2,
    price: 0,
  },
  starter: {
    name: "Starter",
    credits: 600,
    maxCredits: 600,
    monthlyCredits: 600,
    scraperLimit: Infinity,
    sequenceLimit: 5,
    templateLimit: 10,
    memberLimit: 5,
    toneLimit: 5,
    price: 1499,
  },
  pro: {
    name: "Pro",
    credits: 1500,
    maxCredits: 1500,
    monthlyCredits: 1500,
    scraperLimit: Infinity,
    sequenceLimit: Infinity,
    templateLimit: Infinity,
    memberLimit: 10,
    toneLimit: Infinity,
    price: 2499,
  },
  agency: {
    name: "Agency",
    credits: Infinity,
    maxCredits: Infinity,
    monthlyCredits: Infinity,
    scraperLimit: Infinity,
    sequenceLimit: Infinity,
    templateLimit: Infinity,
    memberLimit: Infinity,
    toneLimit: Infinity,
    price: 4999,
  },
} as const;

// Credit costs per action
export const CREDIT_COSTS: Record<ActionType, number> = {
  email: 1,
  linkedin: 1,
  sequence: 3,
  scraper: 5,
  deliverability: 1,
};

// User credit fields interface
// User credit fields interface
export interface UserCreditData {
  plan: PlanType;
  credits: number;
  maxCredits: number;
  monthlyCredits: number;
  scraperLimit: number;
  scraperUsed: number;
  nextReset: number;
  planUpdatedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspacePlan {
  planId: string;
  credits: number;
  
  // Limits (-1 for unlimited)
  scraperLimit: number;
  sequenceLimit: number;
  templateLimit: number;
  memberLimit: number;
  toneLimit: number;
  
  // Usage
  scraperUsed: number;
  sequenceUsed: number;
  templateCount: number;
  toneUsed: number;
  
  // Features
  apiAccess: boolean;
  deepScraper: boolean;
  analyticsLevel: number;
  
  [key: string]: any;
}
