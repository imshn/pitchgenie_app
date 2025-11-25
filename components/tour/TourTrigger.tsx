/**
 * TourTrigger Component
 * Automatically starts the tour for first-time users
 */

"use client";

import { useEffect, useRef } from "react";
import { useTour } from "./TourProvider";
import { useAuth } from "@/app/hooks/useAuth";
import axios from "axios";

export function TourTrigger() {
    const { user, loading } = useAuth();
    const { startTour, isActive } = useTour();
    const hasChecked = useRef(false);

    useEffect(() => {
        // Prevent starting if tour already active, already checked, or flag set
        if (loading || !user || isActive || hasChecked.current) return;
        // If a tour was already started in this session, don't restart
        if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('tourStarted') === 'true') {
            return;
        }
        const checkAndStartTour = async () => {
            try {
                const token = await user.getIdToken();
                const res = await axios.get("/api/onboarding/get", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                // Mark that we've checked
                hasChecked.current = true;
                // Start tour if user hasn't seen it yet
                if (res.data.firstTimeTourCompleted === false) {
                    setTimeout(() => {
                        startTour();
                        // Remember that tour has started for this session
                        if (typeof sessionStorage !== 'undefined') {
                            sessionStorage.setItem('tourStarted', 'true');
                        }
                    }, 500);
                }
            } catch (error) {
                console.error("Failed to check tour status:", error);
            }
        };
        checkAndStartTour();
    }, [user, loading, startTour, isActive]);

    return null; // This component doesn't render anything
}
