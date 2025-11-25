/**
 * MotionCard Component
 * 
 * Reusable animated card wrapper with consistent transitions
 */

"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { Card as ShadcnCard } from "@/components/ui/card";
import { ReactNode } from "react";

interface MotionCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
    children: ReactNode;
    delay?: number;
    direction?: "left" | "right" | "up" | "down";
    className?: string;
}

export function MotionCard({
    children,
    delay = 0,
    direction = "up",
    className = "",
    ...props
}: MotionCardProps) {
    const directions = {
        left: { x: -50, y: 0 },
        right: { x: 50, y: 0 },
        up: { x: 0, y: 20 },
        down: { x: 0, y: -20 },
    };

    return (
        <motion.div
            initial={{
                opacity: 0,
                ...directions[direction]
            }}
            animate={{
                opacity: 1,
                x: 0,
                y: 0
            }}
            exit={{
                opacity: 0,
                ...directions[direction]
            }}
            transition={{
                duration: 0.3,
                delay,
                ease: "easeOut"
            }}
            {...props}
        >
            <ShadcnCard className={className}>
                {children}
            </ShadcnCard>
        </motion.div>
    );
}
