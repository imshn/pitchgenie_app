"use client";

import { usePlanData } from "./usePlanData";

export function usePlanLimits() {
    const { data, loading, error } = usePlanData();

    if (loading || !data) {
        return {
            loading: true,
            isMemberLimitReached: false,
            isCreditLimitReached: false,
            isSmtpLimitReached: false,
            isTemplateLimitReached: false,
            planName: "",
            remaining: null
        };
    }

    return {
        loading: false,
        isMemberLimitReached: data.remaining.members <= 0,
        isCreditLimitReached: data.remaining.credits <= 0,
        isSmtpLimitReached: data.remaining.smtpDailyRemaining <= 0,
        isTemplateLimitReached: data.remaining.templates <= 0,
        planName: data.planData.name,
        remaining: data.remaining,
        planData: data.planData
    };
}
