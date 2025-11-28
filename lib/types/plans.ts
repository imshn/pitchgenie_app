import { Timestamp } from "firebase-admin/firestore";

// Plan document in /plans collection
export interface PlanDocument {
  id: "free" | "starter" | "pro" | "agency";
  name: string;
  priceMonthly: number; // INR integer
  priceYearly: number; // INR integer
  memberLimit: number;
  creditLimit: number;
  scraperLightLimit: number; // light scrapes per month
  scraperDeepLimit: number; // deep scrapes per month
  deepScraperEnabled: boolean;
  sequenceLimit: number;
  templateLimit: number;
  aiToneModes: number;
  smtpDailyLimit: number; // emails per day
  imapSyncIntervalSeconds: number | null; // null for no IMAP
  integrations: {
    notion: boolean;
    slack: boolean;
    sheetsSync: boolean;
    zapier: boolean;
  };
  features: string[]; // ordered feature list for UI
  tagColor: string; // hex color
  badge: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User document in /users/{userId}
export interface UserDocument {
  uid: string;
  email: string;
  displayName?: string;
  planType: "free" | "starter" | "pro" | "agency";
  workspaceId?: string | null;
  currentWorkspaceId?: string;
  nextResetDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User profile in /users/{userId}/profile/profile
export interface UserProfile {
  displayName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  timezone?: string;
  location?: string;
  company?: {
    name?: string;
    website?: string;
    industry?: string;
    size?: string;
    foundedYear?: number;
    about?: string;
    founder?: string;
    services?: string[];
    logoUrl?: string;
  };
  persona?: string | null;
  pitchTone?: string | null;
  primaryUseCase?: string | null;
  contactEmail?: string;
  contactPhone?: string;
  publicProfile?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Usage document in /users/{userId}/usage/{YYYY-MM}
export interface UsageDocument {
  monthId: string; // YYYY-MM format
  creditsUsed: number;
  lightScrapesUsed: number;
  deepScrapesUsed: number;
  sequencesUsed: number;
  templatesUsed: number;
  smtpEmailsSent: number;
  aiGenerations: number;
  imapSyncCount: number;
  resetDate: Timestamp; // next reset timestamp
  updatedAt: Timestamp;
}

// SMTP daily tracking in /users/{userId}/smtpDaily/{YYYY-MM-DD}
export interface SmtpDailyDocument {
  date: string; // YYYY-MM-DD format
  emailsSent: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Workspace document in /workspaces/{workspaceId}
export interface WorkspaceDocument {
  id: string;
  name: string;
  ownerId: string;
  planId: "free" | "starter" | "pro" | "agency";
  members: Array<{
    uid: string;
    role: "owner" | "admin" | "member";
    joinedAt: Timestamp;
  }>;
  credits?: number; // optional workspace credit balance
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Add-on credits pack
export interface AddonCreditPack {
  id: string;
  price: number; // INR
  credits: number;
}

// Add-on credits document in /plans/addonCredits
export interface AddonCreditsDocument {
  packs: AddonCreditPack[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Credit operation types
export type CreditOperation =
  | "aiGeneration" // 1 credit
  | "emailSequence" // 3 credits
  | "linkedinMessage" // 1 credit
  | "lightScrape" // 5 credits
  | "deepScrape" // 15 credits
  | "smtpSend" // 1 credit
  | "imapSync" // 2 credits
  | "deliverabilityCheck" // 2 credits
  | "templateSave" // 0 credits
  | "export"; // 0 credits

// Credit consumption mapping
export const CREDIT_COSTS: Record<CreditOperation, number> = {
  aiGeneration: 1, // AI Email
  emailSequence: 3,
  linkedinMessage: 1,
  lightScrape: 5,
  deepScrape: 15,
  smtpSend: 1,
  imapSync: 2,
  deliverabilityCheck: 2, // Not specified in strict list, keeping 2
  templateSave: 0,
  export: 0,
};

// Error codes for operation failures
export enum OperationErrorCode {
  INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS",
  SCRAPER_LIMIT_REACHED = "SCRAPER_LIMIT_REACHED",
  SMTP_DAILY_LIMIT = "SMTP_DAILY_LIMIT",
  SEQUENCE_LIMIT = "SEQUENCE_LIMIT",
  TEMPLATE_LIMIT = "TEMPLATE_LIMIT",
  IMAP_NOT_ALLOWED = "IMAP_NOT_ALLOWED",
  DEEP_SCRAPER_NOT_ALLOWED = "DEEP_SCRAPER_NOT_ALLOWED",
  INTEGRATION_NOT_ALLOWED = "INTEGRATION_NOT_ALLOWED",
  MEMBER_LIMIT_REACHED = "MEMBER_LIMIT_REACHED",
}

// Merged plan data (returned by getUserPlan/getWorkspacePlan)
export interface MergedPlanData {
  userId: string;
  billingUserId?: string;
  workspaceId?: string | null;
  planType: "free" | "starter" | "pro" | "agency";
  personalPlanType: "free" | "starter" | "pro" | "agency";
  planData: PlanDocument;
  usage: UsageDocument;
  profile: UserProfile | null;
  remaining: {
    credits: number;
    lightScrapes: number;
    deepScrapes: number;
    sequences: number;
    templates: number;
    smtpDailyRemaining: number;
  };
  canScrapeDeep: boolean;
}

// Operation details for checkAndConsumeOperation
export interface OperationDetails {
  operation: CreditOperation;
  metadata?: Record<string, any>;
}

// Increments for chargeCreditsAtomic
export interface UsageIncrements {
  lightScrapes?: number;
  deepScrapes?: number;
  aiGenerations?: number;
  smtpEmailsSent?: number;
  sequencesUsed?: number;
  templatesUsed?: number;
  imapSyncCount?: number;
}
