import { NextResponse } from "next/server";
import { MergedPlanData, OperationErrorCode } from "@/lib/types/plans";

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
  plan: MergedPlanData,
  feature: FeatureType,
  costOrCount: number = 1
): NextResponse | null {
  
  const { planData, remaining } = plan;

  // 1. Check Credits (Global check for cost-based features)
  if (feature === "credits") {
    if (remaining.credits < costOrCount) {
      return NextResponse.json({ 
        error: OperationErrorCode.INSUFFICIENT_CREDITS, 
        message: "You do not have enough credits for this action.",
        current: remaining.credits,
        required: costOrCount
      }, { status: 402 });
    }
  }

  // 2. Check Feature Specific Limits
  switch (feature) {
    case "scraper":
      // Checking Light Scrapes by default for "scraper" feature
      if (remaining.lightScrapes < costOrCount) {
         return NextResponse.json({ 
          error: OperationErrorCode.SCRAPER_LIMIT_REACHED, 
          message: `You have reached your scraper limit of ${planData.scraperLightLimit} for this month. Upgrade to Pro for more.`,
          limit: planData.scraperLightLimit
        }, { status: 403 });
      }
      break;

    case "sequence":
      if (remaining.sequences < costOrCount) {
         return NextResponse.json({ 
          error: OperationErrorCode.SEQUENCE_LIMIT, 
          message: `You have reached your active sequence limit of ${planData.sequenceLimit}.`,
          limit: planData.sequenceLimit
        }, { status: 403 });
      }
      break;

    case "templates":
      if (remaining.templates < costOrCount) {
         return NextResponse.json({ 
          error: OperationErrorCode.TEMPLATE_LIMIT, 
          message: `You have reached your template limit of ${planData.templateLimit}.`,
          limit: planData.templateLimit
        }, { status: 403 });
      }
      break;

    case "members":
      if (planData.memberLimit !== -1 && costOrCount > planData.memberLimit) {
         return NextResponse.json({ 
          error: OperationErrorCode.MEMBER_LIMIT_REACHED, 
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
      if (!planData.deepScraperEnabled) {
          return NextResponse.json({ 
              error: OperationErrorCode.DEEP_SCRAPER_NOT_ALLOWED, 
              message: "Deep scraping is only available on Starter plans and above." 
          }, { status: 403 });
      }
      // Also check limit
      if (remaining.deepScrapes < costOrCount) {
        return NextResponse.json({ 
            error: OperationErrorCode.SCRAPER_LIMIT_REACHED, 
            message: `You have reached your deep scraper limit of ${planData.scraperDeepLimit}.`,
            limit: planData.scraperDeepLimit
          }, { status: 403 });
      }
      break;
  }

  // If all checks pass, return null (no error)
  return null;
}
