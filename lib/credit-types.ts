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
    scraperLimit: 5, // Light scrape limit
    sequenceLimit: 1,
    templateLimit: 2,
    memberLimit: 2,
    toneLimit: 2,
    price: 0,
  },
  starter: {
    name: "Starter",
    credits: 600,
    maxCredits: 600,
    monthlyCredits: 600,
    scraperLimit: 100, // Light scrape limit
    sequenceLimit: 5,
    templateLimit: 10,
    memberLimit: 2,
    toneLimit: 5,
    price: 1999,
  },
  pro: {
    name: "Pro",
    credits: 1500,
    maxCredits: 1500,
    monthlyCredits: 1500,
    scraperLimit: 300, // Light scrape limit
    sequenceLimit: 15,
    templateLimit: 40,
    memberLimit: 5,
    toneLimit: 10,
    price: 3499,
  },
  agency: {
    name: "Agency",
    credits: 5000,
    maxCredits: 5000,
    monthlyCredits: 5000,
    scraperLimit: 1000, // Light scrape limit
    sequenceLimit: 50,
    templateLimit: 100,
    memberLimit: 20,
    toneLimit: 20,
    price: 6999,
  },
} as const;

// Credit costs per action
export const CREDIT_COSTS: Record<ActionType, number> = {
  email: 2,
  linkedin: 1,
  sequence: 5,
  scraper: 5, // Light scrape
  deliverability: 2, // Keeping as 2 or default? User didn't specify, assuming 2 or 1? Old was 1. Let's keep 1 unless specified? Actually user didn't specify deliverability. I'll leave it at 1 or maybe 2 to be safe? Let's stick to 1 as it wasn't mentioned in "MANDATORY". Wait, I should check if I missed it. "Email Generation: 2, LinkedIn Message: 1, Email Sequence: 5, Light Scrape: 5, Deep Scrape: 15, SMTP Email Sending: 1, IMAP Sync: 2". Deliverability is not there. I'll keep it at 1.
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
