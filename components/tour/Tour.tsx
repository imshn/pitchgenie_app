// Main Tour Component
// Orchestrates the product tour across pages, handling navigation, spotlight, and tooltip positioning.

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTour } from "./TourProvider";
import { Spotlight } from "./Spotlight";
import { Tooltip } from "./Tooltip";
import { WelcomeModal } from "./WelcomeModal";
import { tourSteps } from "@/lib/tourSteps";
import { auth } from "@/lib/firebase";
import axios from "axios";
import toast from "react-hot-toast";

export function Tour() {
    const router = useRouter();
    const pathname = usePathname();
    const {
        isActive,
        currentStep,
        currentStepData,
        nextStep,
        prevStep,
        endTour,
        skipTour,
    } = useTour();

    const [showSpotlight, setShowSpotlight] = useState(false);

    // Helper: wait until the target element exists before showing spotlight
    const waitForTarget = (callback: () => void) => {
        if (!currentStepData?.target) {
            callback();
            return;
        }
        const selector = `[data-tour="${currentStepData.target}"]`;
        let attempts = 0;
        const maxAttempts = 30; // ~3 seconds
        const interval = setInterval(() => {
            const el = document.querySelector(selector);
            if (el) {
                clearInterval(interval);
                callback();
            } else if (++attempts >= maxAttempts) {
                clearInterval(interval);
                // Fallback: show anyway to avoid dead‑lock
                callback();
            }
        }, 100);
    };

    // Effect: handle navigation and spotlight visibility when step changes
    useEffect(() => {
        if (!isActive || !currentStepData) return;

        // Welcome step – just show modal, no navigation needed
        if (currentStepData.showWelcome) {
            setShowSpotlight(true);
            return;
        }

        const navigateTo = currentStepData.navigateTo;
        if (navigateTo && navigateTo !== pathname) {
            // Hide spotlight while navigating
            setShowSpotlight(false);
            router.push(navigateTo);
            // Do not wait here; the effect will re-run when pathname updates
            return;
        }
        // Same page – ensure the target exists before showing spotlight
        setShowSpotlight(false);
        waitForTarget(() => setShowSpotlight(true));
    }, [currentStep, isActive, currentStepData, router, pathname]);

    const handleNext = async () => {
        const isLastStep = currentStep === tourSteps.length - 1;
        if (isLastStep) {
            await completeTour();
            endTour();
        } else {
            nextStep();
        }
    };

    const handleSkip = async () => {
        await completeTour();
        skipTour();
    };

    const completeTour = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();
            await axios.post("/api/tour/complete", {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Tour completed! 🎉");
        } catch (error) {
            console.error("Failed to mark tour as complete:", error);
        }
    };

    if (!isActive) return null;

    const showWelcome = currentStepData?.showWelcome === true;

    return (
        <>
            {showWelcome ? (
                <WelcomeModal isOpen={true} onStart={nextStep} onSkip={handleSkip} />
            ) : (
                showSpotlight && (
                    <>
                        <Spotlight target={currentStepData?.target || ""} isActive={true} />
                        <Tooltip
                            target={currentStepData?.target || ""}
                            title={currentStepData?.title || ""}
                            description={currentStepData?.description || ""}
                            placement={currentStepData?.placement}
                            step={currentStep}
                            totalSteps={tourSteps.length}
                            onNext={handleNext}
                            onPrev={prevStep}
                            onClose={handleSkip}
                            isActive={true}
                        />
                    </>
                )
            )}
        </>
    );
}
