/**
 * Onboarding Step 1: Welcome Screen
 * Enhanced with animations
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import axios from "axios";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { AnimatedBackground } from "@/components/onboarding/AnimatedBackground";
import { MotionCard } from "@/components/onboarding/MotionCard";
import { LottieAnimation } from "@/components/onboarding/LottieAnimation";
import { Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function OnboardingStep1() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");
    const [skipping, setSkipping] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                router.push("/login");
                return;
            }

            const token = await user.getIdToken();
            const res = await axios.get("/api/onboarding/get", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUserName(res.data.name || res.data.email || "there");

            if (res.data.onboardingCompleted) {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBegin = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();
            await axios.post(
                "/api/onboarding/update",
                { onboardingStep: 2 },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            router.push("/onboarding/step2");
        } catch (error) {
            toast.error("Failed to start onboarding");
        }
    };

    const handleSkip = async () => {
        setSkipping(true);
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();

            await axios.post(
                "/api/onboarding/complete",
                { plan: "free" },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Welcome! You're all set with the Free plan");
            router.push("/dashboard");
        } catch (error) {
            toast.error("Failed to skip onboarding");
            setSkipping(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            <AnimatedBackground />

            <div className="w-full max-w-2xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ProgressIndicator currentStep={1} />
                </motion.div>

                <MotionCard delay={0.1} direction="up" className="border-2">
                    <CardHeader className="text-center space-y-4 pb-8">
                        <motion.div
                            className="flex justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        >
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Sparkles className="h-8 w-8 text-primary" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <CardTitle className="text-3xl font-bold">
                                Welcome, {userName}! 👋
                            </CardTitle>
                            <CardDescription className="text-lg mt-2">
                                Let's personalize your outreach experience in just 2 minutes
                            </CardDescription>
                        </motion.div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {[
                                { num: 1, text: "Set up profile" },
                                { num: 2, text: "Choose plan" },
                                { num: 3, text: "Start creating" },
                            ].map((item, index) => (
                                <motion.div
                                    key={item.num}
                                    className="text-center p-4 rounded-lg bg-primary/5"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <div className="text-2xl font-bold text-primary">{item.num}</div>
                                    <p className="text-sm text-muted-foreground mt-1">{item.text}</p>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <Button
                                size="lg"
                                className="w-full"
                                onClick={handleBegin}
                                // whileHover={{ scale: 1.02 }}
                                // whileTap={{ scale: 0.98 }}
                                asChild
                            >
                                <motion.button>Begin Setup</motion.button>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                        >
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={handleSkip}
                                disabled={skipping}
                                // whileHover={{ scale: 1.02 }}
                                // whileTap={{ scale: 0.98 }}
                                asChild
                            >
                                <motion.button>
                                    {skipping ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Setting up...
                                        </>
                                    ) : (
                                        "Skip onboarding (start with Free plan)"
                                    )}
                                </motion.button>
                            </Button>
                        </motion.div>
                    </CardContent>
                </MotionCard>
            </div>
        </div>
    );
}
