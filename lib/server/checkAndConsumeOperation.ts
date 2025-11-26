import { getUserPlan } from "./getUserPlan";
import { chargeCreditsAtomic } from "./chargeCreditsAtomic";
import { CreditOperation, CREDIT_COSTS, OperationErrorCode, OperationDetails } from "@/lib/types/plans";

/**
 * Get current month in YYYY-MM format (UTC)
 */
function getCurrentMonthId(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Check if user can perform operation and consume credits atomically
 * 
 * @param userId - Firebase user ID
 * @param operation - Operation type
 * @param details - Optional operation metadata
 * @returns Success object with updated plan data
 * @throws Error with OperationErrorCode if operation not allowed
 */
export async function checkAndConsumeOperation(
  userId: string,
  operation: CreditOperation,
  details?: OperationDetails["metadata"]
): Promise<{ success: true; message: string }> {
  
  const monthId = getCurrentMonthId();
  const creditCost = CREDIT_COSTS[operation];

  try {
    // Fetch current plan and usage
    const planData = await getUserPlan(userId, monthId);

    // Check credit balance
    if (planData.remaining.credits < creditCost) {
      throw new Error(OperationErrorCode.INSUFFICIENT_CREDITS);
    }

    // Operation-specific limit checks
    switch (operation) {
      case "lightScrape":
        if (planData.remaining.lightScrapes <= 0) {
          throw new Error(OperationErrorCode.SCRAPER_LIMIT_REACHED);
        }
        break;

      case "deepScrape":
        if (!planData.canScrapeDeep) {
          throw new Error(OperationErrorCode.DEEP_SCRAPER_NOT_ALLOWED);
        }
        if (planData.remaining.deepScrapes <= 0) {
          throw new Error(OperationErrorCode.SCRAPER_LIMIT_REACHED);
        }
        break;

      case "emailSequence":
        if (planData.remaining.sequences <= 0) {
          throw new Error(OperationErrorCode.SEQUENCE_LIMIT);
        }
        break;

      case "templateSave":
        if (planData.remaining.templates <= 0) {
          throw new Error(OperationErrorCode.TEMPLATE_LIMIT);
        }
        break;

      case "smtpSend":
        if (planData.remaining.smtpDailyRemaining <= 0) {
          throw new Error(OperationErrorCode.SMTP_DAILY_LIMIT);
        }
        break;

      case "imapSync":
        if (planData.planData.imapSyncIntervalSeconds === null) {
          throw new Error(OperationErrorCode.IMAP_NOT_ALLOWED);
        }
        break;

      case "aiGeneration":
      case "linkedinMessage":
      case "deliverabilityCheck":
      case "export":
        // These only check credits, no additional limits
        break;

      default:
        console.warn(`[checkAndConsumeOperation] Unknown operation: ${operation}`);
    }

    // Prepare increments based on operation
    const increments: any = {};

    switch (operation) {
      case "lightScrape":
        increments.lightScrapes = 1;
        break;

      case "deepScrape":
        increments.deepScrapes = 1;
        break;

      case "aiGeneration":
      case "linkedinMessage":
        increments.aiGenerations = 1;
        break;

      case "emailSequence":
        increments.aiGenerations = 3; // Sequence counts as 3 generations
        increments.sequencesUsed = 1;
        break;

      case "smtpSend":
        increments.smtpEmailsSent = 1;
        break;

      case "imapSync":
        increments.imapSyncCount = 1;
        break;

      case "templateSave":
        increments.templatesUsed = 1;
        break;

      case "deliverabilityCheck":
      case "export":
        // No special increments
        break;
    }

    // Atomically charge credits and update usage
    await chargeCreditsAtomic(
      userId,
      monthId,
      creditCost,
      increments,
      planData.planData.creditLimit
    );

    console.log(
      `[checkAndConsumeOperation] ${operation} successful for user ${userId}. Cost: ${creditCost} credits`
    );

    return {
      success: true,
      message: `Operation ${operation} completed. ${creditCost} credits consumed.`
    };

  } catch (error: any) {
    // Log error with context
    console.error(`[checkAndConsumeOperation] Failed for user ${userId}, operation ${operation}:`, error.message);

    // Re-throw with clear error code
    throw error;
  }
}

/**
 * Helper to check if user has specific integration enabled
 */
export async function checkIntegrationAccess(
  userId: string,
  integration: "notion" | "slack" | "sheetsSync" | "zapier"
): Promise<boolean> {
  try {
    const planData = await getUserPlan(userId);
    return planData.planData.integrations[integration];
  } catch (error) {
    console.error(`[check IntegrationAccess] Error for user ${userId}:`, error);
    return false;
  }
}

/**
 * Helper to check if user can access IMAP
 */
export async function checkImapAccess(userId: string): Promise<boolean> {
  try {
    const planData = await getUserPlan(userId);
    return planData.planData.imapSyncIntervalSeconds !== null;
  } catch (error) {
    console.error(`[checkImapAccess] Error for user ${userId}:`, error);
    return false;
  }
}
