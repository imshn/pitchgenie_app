/**
 * AnimatedBackground Component
 * 
 * Subtle animated gradient background with moving blobs
 */

"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />

            {/* Animated blob 1 */}
            <motion.div
                className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full"
                style={{ filter: "blur(80px)" }}
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Animated blob 2 */}
            <motion.div
                className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/3 rounded-full"
                style={{ filter: "blur(80px)" }}
                animate={{
                    x: [0, -100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                }}
            />

            {/* Animated blob 3 */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/3 rounded-full"
                style={{ filter: "blur(80px)" }}
                animate={{
                    x: [-50, 50, -50],
                    y: [-30, 30, -30],
                    scale: [1, 1.3, 1],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5,
                }}
            />
        </div>
    );
}
