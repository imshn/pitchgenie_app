"use client";

import { usePlanData } from "@/hooks/usePlanData";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UpgradePlanModal } from "@/components/credits/UpgradePlanModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlanType } from "@/lib/credit-types";

type Feature =
  | "scraper"
  | "sequence"
  | "templates"
  | "members"
  | "credits"
  | "tone"
  | "smtp";

export function usePlanLimit(): {
  checkLimit: (feature: Feature, showToast?: boolean) => boolean;
  plan: any;
  isLoading: boolean;
  PlanLimitModal: React.FC;
  refreshPlan: () => void;
} {
  const { data: planData, loading: isLoading, refetch } = usePlanData();
  const { toast } = useToast();
  const router = useRouter();

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: "", description: "" });

  const checkLimit = (feature: Feature, showToast = true): boolean => {
    // 1. Check for loading or missing plan data
    if (isLoading) {
      setAlertMessage({
        title: "Loading Plan Data",
        description: "Please wait while we load your plan details."
      });
      setAlertModalOpen(true);
      return false;
    }

    if (!planData) {
      setAlertMessage({
        title: "Plan Data Not Found",
        description: "We couldn't retrieve your plan details. Please try refreshing the page."
      });
      setAlertModalOpen(true);
      return false;
    }

    let isLimitReached = false;
    let limitName = "";
    let limitValue = 0;
    let currentValue = 0;

    switch (feature) {
      case "scraper":
        // Check light scrapes by default for generic "scraper" check, or maybe check both?
        // For simplicity, let's check light scrapes as the primary "scraper" limit for now
        // or check if either is exhausted if we don't distinguish in the UI button yet.
        // But better to be specific. Let's assume "scraper" means light scrapes for now
        // as that's the common case, or we can check if *both* are exhausted?
        // Actually, let's check light scrapes as a safe default.
        isLimitReached = planData.remaining.lightScrapes <= 0;
        limitName = "Scraper";
        limitValue = planData.planData.scraperLightLimit;
        currentValue = planData.usage.lightScrapesUsed;
        break;
      case "sequence":
        isLimitReached = planData.remaining.sequences <= 0;
        limitName = "Sequence";
        limitValue = planData.planData.sequenceLimit;
        currentValue = planData.usage.sequencesUsed;
        break;
      case "templates":
        isLimitReached = planData.remaining.templates <= 0;
        limitName = "Template";
        limitValue = planData.planData.templateLimit;
        currentValue = planData.usage.templatesUsed;
        break;
      case "members":
        isLimitReached = planData.remaining.members <= 0;
        limitName = "Member";
        limitValue = planData.planData.memberLimit;
        currentValue = planData.membersCount;
        break;
      case "credits":
        isLimitReached = planData.remaining.credits <= 0;
        limitName = "Credit";
        limitValue = planData.planData.creditLimit;
        currentValue = planData.usage.creditsUsed;
        break;
      case "tone":
        // Tone limit not explicitly in remaining, but we have aiToneModes
        // Let's assume it's always allowed for now or check planData.planData.aiToneModes
        limitName = "Tone";
        limitValue = planData.planData.aiToneModes;
        currentValue = 0;
        break;
      case "smtp":
        isLimitReached = planData.remaining.smtpDailyRemaining <= 0;
        limitName = "Daily Email";
        limitValue = planData.planData.smtpDailyLimit;
        currentValue = planData.usage.smtpEmailsSent;
        break;
    }

    if (isLimitReached) {
      setUpgradeModalOpen(true);
      return false; // Limit reached, action denied
    }

    return true; // Limit not reached, action allowed
  };

  const PlanLimitModal = () => (
    <>
      <UpgradePlanModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlan={(planData?.planType as PlanType) || "free"}
      />

      <AlertDialog open={alertModalOpen} onOpenChange={setAlertModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertMessage.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertModalOpen(false)}>
              Okay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return { checkLimit, plan: planData, isLoading, PlanLimitModal, refreshPlan: refetch };
}
