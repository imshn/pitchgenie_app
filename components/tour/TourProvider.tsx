/**
 * TourProvider Context
 * Manages the product tour state and provides tour functionality
 */

"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { tourSteps, TourStep } from "@/lib/tourSteps";

interface TourContextType {
    isActive: boolean;
    currentStep: number;
    currentStepData: TourStep | null;
    startTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    endTour: () => void;
    skipTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const currentStepData = isActive && currentStep < tourSteps.length
        ? tourSteps[currentStep]
        : null;

    const startTour = useCallback(() => {
        setIsActive(true);
        setCurrentStep(0);
    }, []);

    const nextStep = useCallback(() => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            endTour();
        }
    }, [currentStep]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const endTour = useCallback(() => {
        setIsActive(false);
        setCurrentStep(0);
    }, []);

    const skipTour = useCallback(() => {
        endTour();
    }, [endTour]);

    // Prevent body scroll when tour is active
    useEffect(() => {
        if (isActive) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isActive]);

    return (
        <TourContext.Provider
            value={{
                isActive,
                currentStep,
                currentStepData,
                startTour,
                nextStep,
                prevStep,
                endTour,
                skipTour,
            }}
        >
            {children}
        </TourContext.Provider>
    );
}

export function useTour() {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error("useTour must be used within TourProvider");
    }
    return context;
}
