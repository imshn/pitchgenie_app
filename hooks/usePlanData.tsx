"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

// Updated interface to match new V2 schema
export interface PlanData {
    id: string;
    name: string;
    priceMonthly: number;
    priceYearly: number;
    memberLimit: number;
    creditLimit: number;
    scraperLightLimit: number; // NEW: separate light scrapes
    scraperDeepLimit: number; // NEW: separate deep scrapes
    deepScraperEnabled: boolean;
    sequenceLimit: number;
    templateLimit: number;
    aiToneModes: number;
    smtpDailyLimit: number; // NEW: daily limit (not monthly)
    imapSyncIntervalSeconds: number | null; // NEW: IMAP configuration
    integrations: { // NEW: integrations object
        notion: boolean;
        slack: boolean;
        sheetsSync: boolean;
        zapier: boolean;
    };
    features: string[];
    tagColor: string;
    badge: string | null;
}

export interface UsageData {
    monthId: string;
    creditsUsed: number;
    lightScrapesUsed: number; // NEW: separate from deep
    deepScrapesUsed: number; // NEW: separate from light
    sequencesUsed: number;
    templatesUsed: number;
    smtpEmailsSent: number;
    aiGenerations: number; // NEW: AI generation count
    imapSyncCount: number; // NEW: IMAP sync count
    resetDate: number;
    updatedAt: number;
}

export interface EffectivePlanClient {
    userId: string;
    workspaceId: string | null;
    planType: string;
    planData: PlanData;
    usage: UsageData;
    remaining: {
        credits: number;
        lightScrapes: number; // NEW: separate from deep
        deepScrapes: number; // NEW: separate from light
        sequences: number;
        templates: number;
        smtpDailyRemaining: number; // NEW: daily remaining
    };
    canScrapeDeep: boolean;
}

export function usePlanData() {
    const { user } = useAuth();
    const [data, setData] = useState<EffectivePlanClient | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPlanData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const token = await user.getIdToken();
            const res = await fetch("/api/planDataV2", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch plan data");
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlanData();
    }, [user]);

    return { data, loading, error, refetch: fetchPlanData };
}
