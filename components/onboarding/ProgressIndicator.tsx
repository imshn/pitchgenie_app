/**
 * Progress Indicator Component
 * 
 * Shows current step in onboarding flow with sliding animations
 */

"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface ProgressIndicatorProps {
    currentStep: number;
    totalSteps?: number;
}

export function ProgressIndicator({ currentStep, totalSteps = 3 }: ProgressIndicatorProps) {
    return (
        <div className="w-full mb-8">
            <div className="flex items-center justify-center">
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber < currentStep;
                    const isCurrent = stepNumber === currentStep;

                    return (
                        <div key={stepNumber} className="flex items-center">
                            {/* Step Circle */}
                            <motion.div
                                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all shrink-0
                  ${isCompleted
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : isCurrent
                                            ? "border-primary text-primary"
                                            : "border-muted-foreground text-muted-foreground"
                                    }
                `}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: stepNumber * 0.1 }}
                                whileHover={{ scale: 1.1 }}
                            >
                                {isCompleted ? (
                                    <motion.div
                                        initial={{ rotate: -180, scale: 0 }}
                                        animate={{ rotate: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200 }}
                                    >
                                        <Check className="h-5 w-5" />
                                    </motion.div>
                                ) : (
                                    <span className="text-sm font-semibold">{stepNumber}</span>
                                )}
                            </motion.div>

                            {/* Connector Line */}
                            {stepNumber < totalSteps && (
                                <div className="w-24 md:w-32 h-0.5 mx-2 bg-muted-foreground relative overflow-hidden shrink-0">
                                    {isCompleted && (
                                        <motion.div
                                            className="absolute inset-0 bg-primary"
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            transition={{
                                                delay: stepNumber * 0.1 + 0.2,
                                                duration: 0.3,
                                                ease: "easeOut",
                                            }}
                                            style={{ transformOrigin: "left" }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step Label */}
            <motion.div
                className="text-center mt-4 text-sm text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                Step {currentStep} of {totalSteps}
            </motion.div>
        </div>
    );
}
