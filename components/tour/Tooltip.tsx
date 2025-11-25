/**
 * Tooltip Component
 * Displays tour instructions with navigation buttons
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ArrowLeft, ArrowRight } from "lucide-react";

interface TooltipProps {
    target: string;
    title: string;
    description: string;
    placement?: "top" | "bottom" | "left" | "right";
    step: number;
    totalSteps: number;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
    isActive: boolean;
}

export function Tooltip({
    target,
    title,
    description,
    placement = "bottom",
    step,
    totalSteps,
    onNext,
    onPrev,
    onClose,
    isActive,
}: TooltipProps) {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!isActive || !target) return;

        const element = document.querySelector(`[data-tour="${target}"]`);
        if (!element) return;

        const updatePosition = () => {
            const rect = element.getBoundingClientRect();
            const tooltipWidth = 400;
            const tooltipHeight = 200;
            const gap = 16;

            let top = 0;
            let left = 0;
            let arrowTop = 0;
            let arrowLeft = 0;

            switch (placement) {
                case "bottom":
                    top = rect.bottom + gap;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    arrowTop = -8;
                    arrowLeft = tooltipWidth / 2 - 8;
                    break;
                case "top":
                    top = rect.top - tooltipHeight - gap;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    arrowTop = tooltipHeight;
                    arrowLeft = tooltipWidth / 2 - 8;
                    break;
                case "left":
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.left - tooltipWidth - gap;
                    arrowTop = tooltipHeight / 2 - 8;
                    arrowLeft = tooltipWidth;
                    break;
                case "right":
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.right + gap;
                    arrowTop = tooltipHeight / 2 - 8;
                    arrowLeft = -8;
                    break;
            }

            // Keep tooltip within viewport
            if (left < 16) left = 16;
            if (left + tooltipWidth > window.innerWidth - 16) {
                left = window.innerWidth - tooltipWidth - 16;
            }
            if (top < 16) top = 16;
            if (top + tooltipHeight > window.innerHeight - 16) {
                top = window.innerHeight - tooltipHeight - 16;
            }

            setPosition({ top, left });
            setArrowPosition({ top: arrowTop, left: arrowLeft });
        };

        updatePosition();
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);

        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [target, placement, isActive]);

    if (!isActive) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed z-[9999]"
                style={{ top: position.top, left: position.left }}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                <Card className="w-[400px] border-2 border-primary/50 shadow-2xl">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-1.5">
                                        {Array.from({ length: totalSteps }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {step + 1}/{totalSteps}
                                    </span>
                                </div>
                                <CardTitle className="text-lg">{title}</CardTitle>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mt-1 -mr-1"
                                onClick={onClose}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardDescription className="text-sm">{description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onPrev}
                                disabled={step === 0}
                                className="gap-1"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                            <Button size="sm" onClick={onNext} className="gap-1">
                                {step === totalSteps - 1 ? "Finish" : "Next"}
                                {step < totalSteps - 1 && <ArrowRight className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Arrow pointer */}
                <div
                    className="absolute w-4 h-4 bg-background border-2 border-primary/50 rotate-45"
                    style={{
                        top: arrowPosition.top,
                        left: arrowPosition.left,
                        zIndex: -1,
                    }}
                />
            </motion.div>
        </AnimatePresence>
    );
}
