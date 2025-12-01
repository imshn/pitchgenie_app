
export type ActionType = "email" | "linkedin" | "sequence" | "scraper" | "deliverability";

// Credit costs per action
export const CREDIT_COSTS: Record<ActionType, number> = {
  email: 1,
  linkedin: 1,
  sequence: 3,
  scraper: 5,
  deliverability: 1,
};

