"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock } from "lucide-react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useAppDialog } from "@/components/ui/app-dialog";
import { UpgradeScreen } from "@/components/inbox/UpgradeScreen"; // Or a dedicated modal trigger

interface PlanLimitAlertProps {
    limitType: "members" | "credits" | "smtp" | "templates";
    className?: string;
}

export function PlanLimitAlert({ limitType, className }: PlanLimitAlertProps) {
    const { isMemberLimitReached, isCreditLimitReached, isSmtpLimitReached, isTemplateLimitReached, loading } = usePlanLimits();
    // We can't use useAppDialog here easily if it requires context provider above, 
    // but usually it does. Assuming AppDialogProvider is at root.
    // Actually, UpgradeScreen is a full screen component. We might want a modal.
    // For now, let's just show the alert. The "Upgrade" button logic can be handled by the parent or a global modal trigger.
    // Let's assume we have a way to trigger upgrade. For now, we'll just show the message.

    // Check if limit is reached
    let isReached = false;
    let title = "";
    let description = "";

    if (limitType === "members") {
        isReached = isMemberLimitReached;
        title = "Member Limit Reached";
        description = "You have reached the maximum number of members for your current plan. Upgrade to add more team members.";
    } else if (limitType === "credits") {
        isReached = isCreditLimitReached;
        title = "Credit Limit Reached";
        description = "You have used all your credits for this billing cycle. Upgrade to get more credits.";
    } else if (limitType === "smtp") {
        isReached = isSmtpLimitReached;
        title = "Daily Email Limit Reached";
        description = "You have reached your daily email sending limit. It will reset in a few hours.";
    } else if (limitType === "templates") {
        isReached = isTemplateLimitReached;
        title = "Template Limit Reached";
        description = "You have reached the maximum number of templates for your current plan. Upgrade to create more templates.";
    }

    if (loading || !isReached) return null;

    return (
        <Alert variant="destructive" className={`bg-amber-50 border-amber-200 text-amber-800 ${className}`}>
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 font-semibold flex items-center gap-2">
                {title}
                <Lock className="h-3 w-3" />
            </AlertTitle>
            <AlertDescription className="text-amber-700 mt-1">
                {description}
            </AlertDescription>
        </Alert>
    );
}
