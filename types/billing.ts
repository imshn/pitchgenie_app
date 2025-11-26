export type PlanId = "free" | "starter" | "pro" | "agency";

export interface Plan {
  id: string;
  name: string;
  description: string;
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
  
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceWithPlan {
  id: string;
  workspaceName: string;
  planId: PlanId;
  planRef: string;
  credits: number;
  scraperUsed?: number;
  nextReset?: number;
  ownerUid: string;
  members: WorkspaceMember[];
  memberIds: string[];
  invited: string[];
  createdAt: number;
  updatedAt: number;
  plan: Plan;
}

export interface WorkspaceMember {
  uid: string;
  email: string;
  role: "owner" | "admin" | "member";
  joinedAt: number;
}
