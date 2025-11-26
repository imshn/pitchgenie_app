import { NextResponse } from "next/server";
import { EffectivePlan } from "@/lib/plan-utils";

type FeatureType = 
  | "members" 
  | "credits" 
  | "scraper" 
  | "sequence" 
  | "templates" 
  | "tones" 
  | "api" 
  | "analytics"
  | "deepScraper"
  | "smtpCustom";

export function checkPlanLimit(
  plan: EffectivePlan,
  feature: FeatureType,
  costOrCount: number = 1
): NextResponse | null {
  
  const { planData, usage, remaining } = plan;

  // 1. Check Credits (Global check for cost-based features)
  if (feature === "credits") {
    if (remaining.credits < costOrCount) {
      return NextResponse.json({ 
        error: "INSUFFICIENT_CREDITS", 
        message: "You do not have enough credits for this action.",
        current: remaining.credits,
        required: costOrCount
      }, { status: 402 });
    }
  }

  // 2. Check Feature Specific Limits
  switch (feature) {
    case "scraper":
      if (remaining.scraper !== "unlimited" && remaining.scraper < costOrCount) {
         return NextResponse.json({ 
          error: "LIMIT_EXCEEDED", 
          message: `You have reached your scraper limit of ${planData.scraperLimit} for this month. Upgrade to Pro for unlimited scraping.`,
          limit: planData.scraperLimit
        }, { status: 403 });
      }
      break;

    case "sequence":
      if (remaining.sequences < costOrCount) {
         return NextResponse.json({ 
          error: "LIMIT_EXCEEDED", 
          message: `You have reached your active sequence limit of ${planData.sequenceLimit}.`,
          limit: planData.sequenceLimit
        }, { status: 403 });
      }
      break;

    case "templates":
      if (remaining.templates < costOrCount) {
         return NextResponse.json({ 
          error: "LIMIT_EXCEEDED", 
          message: `You have reached your template limit of ${planData.templateLimit}.`,
          limit: planData.templateLimit
        }, { status: 403 });
      }
      break;

    case "members":
      // For members, we usually check current count vs limit. 
      // Assuming 'costOrCount' passed here is the NEW total count or we check remaining?
      // Let's assume the caller checks remaining.members or passes the current count to compare.
      // But EffectivePlan doesn't have 'remaining.members'. 
      // Let's rely on planData.memberLimit directly if needed, but for now let's skip or implement if needed.
      if (planData.memberLimit !== -1 && costOrCount > planData.memberLimit) {
         return NextResponse.json({ 
          error: "LIMIT_EXCEEDED", 
          message: `You have reached your team member limit of ${planData.memberLimit}.`,
          limit: planData.memberLimit
        }, { status: 403 });
      }
      break;
    
    case "tones":
       if (costOrCount > planData.aiToneModes) {
          return NextResponse.json({ 
              error: "UPGRADE_REQUIRED", 
              message: "This AI tone is not available on your current plan.",
              requiredLevel: costOrCount
          }, { status: 403 });
       }
       break;

    case "deepScraper":
      if (!planData.deepScraper) {
          return NextResponse.json({ 
              error: "DEEP_SCRAPER_NOT_ALLOWED", 
              message: "Deep scraping is only available on Starter plans and above." 
          }, { status: 403 });
      }
      break;
  }

  // If all checks pass, return null (no error)
  return null;
}
