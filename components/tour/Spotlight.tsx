/**
 * Spotlight Component
 * Creates a spotlight effect highlighting the target element
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface SpotlightProps {
    target: string; // data-tour attribute value
    isActive: boolean;
}

export function Spotlight({ target, isActive }: SpotlightProps) {
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!isActive || !target) {
            setRect(null);
            return;
        }

        const element = document.querySelector(`[data-tour="${target}"]`);
        if (!element) {
            setRect(null);
            return;
        }

        const updatePosition = () => {
            const elementRect = element.getBoundingClientRect();
            setRect(elementRect);
        };

        updatePosition();

        // Update position on scroll and resize
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);

        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [target, isActive]);

    if (!isActive || !rect) return null;

    const padding = 8;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[9998] pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Dark overlay with cutout */}
                <svg
                    className="absolute inset-0 w-full h-full"
                    style={{ pointerEvents: "auto" }}
                >
                    <defs>
                        <mask id="spotlight-mask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            <motion.rect
                                x={rect.left - padding}
                                y={rect.top - padding}
                                width={rect.width + padding * 2}
                                height={rect.height + padding * 2}
                                rx="8"
                                fill="black"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            />
                        </mask>
                    </defs>
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="rgba(0, 0, 0, 0.7)"
                        mask="url(#spotlight-mask)"
                    />
                </svg>

                {/* Glowing border around target */}
                <motion.div
                    className="absolute border-2 border-primary rounded-lg shadow-lg shadow-primary/50"
                    style={{
                        left: rect.left - padding,
                        top: rect.top - padding,
                        width: rect.width + padding * 2,
                        height: rect.height + padding * 2,
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                />
            </motion.div>
        </AnimatePresence>
    );
}
