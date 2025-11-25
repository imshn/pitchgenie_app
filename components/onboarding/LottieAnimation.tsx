/**
 * LottieAnimation Component
 * 
 * Reusable Lottie animation player
 */

"use client";

import { useEffect, useRef } from "react";
import lottie, { AnimationItem } from "lottie-web";

interface LottieAnimationProps {
    animationData?: object;
    path?: string;
    loop?: boolean;
    autoplay?: boolean;
    className?: string;
    speed?: number;
}

export function LottieAnimation({
    animationData,
    path,
    loop = true,
    autoplay = true,
    className = "",
    speed = 1,
}: LottieAnimationProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<AnimationItem | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Load animation
        animationRef.current = lottie.loadAnimation({
            container: containerRef.current,
            renderer: "svg",
            loop,
            autoplay,
            animationData,
            path,
        });

        // Set speed
        animationRef.current.setSpeed(speed);

        // Cleanup
        return () => {
            animationRef.current?.destroy();
        };
    }, [animationData, path, loop, autoplay, speed]);

    return <div ref={containerRef} className={className} />;
}
