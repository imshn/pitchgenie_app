"use client";

import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

type Feature =
  | "scraper"
  | "sequence"
  | "templates"
  | "members"
  | "credits"
  | "tone";

interface PlanLimits {
  scraperLimit: number;
  sequenceLimit: number;
  templateLimit: number;
  memberLimit: number;
  creditLimit: number;
  toneLimit: number;
  // Usage
  scraperUsed: number;
  sequenceUsed: number;
  templateCount: number;
  toneUsed: number;
  credits: number;
  planId: string;
}

export function usePlanLimit(): {
  checkLimit: (feature: Feature, showToast?: boolean) => boolean;
  plan: any;
  isLoading: boolean;
} {
  const { currentWorkspace, isLoading } = useWorkspace();
  const { toast } = useToast();
  const router = useRouter();

  const checkLimit = (feature: Feature, showToast = true): boolean => {
    if (isLoading || !currentWorkspace) return false; // Allow if loading (optimistic) or block? Better to block or wait.

    // Default limits if missing (fallback to free)
    const limits: PlanLimits = {
      scraperLimit: currentWorkspace.scraperLimit ?? 3,
      sequenceLimit: currentWorkspace.sequenceLimit ?? 1,
      templateLimit: currentWorkspace.templateLimit ?? 3,
      memberLimit: currentWorkspace.memberLimit ?? 2,
      creditLimit: currentWorkspace.creditLimit ?? 50,
      toneLimit: currentWorkspace.toneLimit ?? 2,

      scraperUsed: currentWorkspace.scraperUsed ?? 0,
      sequenceUsed: currentWorkspace.sequenceUsed ?? 0,
      templateCount: currentWorkspace.templateCount ?? 0,
      toneUsed: currentWorkspace.toneUsed ?? 0,
      credits: currentWorkspace.credits ?? 0,
      planId: currentWorkspace.planId || "free"
    };

    let isLimitReached = false;
    let limitName = "";
    let limitValue = 0;
    let currentValue = 0;

    switch (feature) {
      case "scraper":
        isLimitReached = limits.scraperUsed >= limits.scraperLimit;
        limitName = "Scraper";
        limitValue = limits.scraperLimit;
        currentValue = limits.scraperUsed;
        break;
      case "sequence":
        isLimitReached = limits.sequenceUsed >= limits.sequenceLimit;
        limitName = "Sequence";
        limitValue = limits.sequenceLimit;
        currentValue = limits.sequenceUsed;
        break;
      case "templates":
        isLimitReached = limits.templateCount >= limits.templateLimit;
        limitName = "Template";
        limitValue = limits.templateLimit;
        currentValue = limits.templateCount;
        break;
      case "members":
        // Members check usually happens on invite, but good to have here
        const memberCount = (currentWorkspace.members?.length || 0) + (currentWorkspace.invited?.length || 0);
        isLimitReached = memberCount >= limits.memberLimit;
        limitName = "Member";
        limitValue = limits.memberLimit;
        currentValue = memberCount;
        break;
      case "credits":
        isLimitReached = limits.credits <= 0;
        limitName = "Credit";
        limitValue = 0;
        currentValue = limits.credits;
        break;
      case "tone":
        isLimitReached = limits.toneUsed >= limits.toneLimit;
        limitName = "Tone";
        limitValue = limits.toneLimit;
        currentValue = limits.toneUsed;
        break;
    }

    if (isLimitReached) {
      if (showToast) {
        toast({
          title: `${limitName} Limit Reached`,
          description: `You have used ${currentValue}/${limitValue} ${limitName.toLowerCase()}s. Please upgrade your plan.`,
          variant: "destructive",
          action: (
            <button
              onClick={() => router.push("/billing")}
              className="bg-white text-destructive px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
            >
              Upgrade
            </button>
          )
        } as any);
      }
      return false; // Limit reached, action denied
    }

    return true; // Limit not reached, action allowed
  };

  return { checkLimit, plan: currentWorkspace, isLoading };
}
