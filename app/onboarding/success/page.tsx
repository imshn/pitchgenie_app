/**
 * Onboarding Success Page
 * Enhanced with confetti animation
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import axios from "axios";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/onboarding/AnimatedBackground";
import { LottieAnimation } from "@/components/onboarding/LottieAnimation";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

export default function OnboardingSuccess() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState("free");

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

            setPlan(res.data.plan || "free");

            if (!res.data.onboardingCompleted) {
                router.push("/onboarding/step1");
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoToDashboard = () => {
        router.push("/dashboard");
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

            {/* Confetti Animation */}
            <motion.div
                className="absolute inset-0 pointer-events-none z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <LottieAnimation
                    path="/lottie/confetti.json"
                    loop={false}
                    className="w-full h-full"
                />
            </motion.div>

            <motion.div
                className="w-full max-w-2xl relative z-10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="border-2">
                    <CardHeader className="text-center space-y-4 pb-8">
                        <motion.div
                            className="flex justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                        >
                            <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-12 w-12 text-green-500" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <CardTitle className="text-3xl font-bold">
                                Your Account is Ready! 🎉
                            </CardTitle>
                            <CardDescription className="text-lg mt-2">
                                Welcome to PitchGenie. Let's start creating amazing outreach campaigns.
                            </CardDescription>
                        </motion.div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { icon: CheckCircle2, text: "Profile Set", subtext: "Ready to personalize" },
                                { icon: Sparkles, text: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`, subtext: "Activated & ready" },
                                { icon: CheckCircle2, text: "All Set", subtext: "Start creating now" },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    className="text-center p-6 rounded-lg bg-primary/5 border-2 border-primary/20"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                    whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary))" }}
                                >
                                    <item.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                                    <p className="font-semibold">{item.text}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{item.subtext}</p>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            className="p-4 rounded-lg bg-muted/50 border"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                        >
                            <h3 className="font-semibold mb-2">Quick Tips:</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {[
                                    "Upload your first lead list to get started",
                                    "Generate personalized emails with AI",
                                    "Track your campaigns in the CRM",
                                    "You can edit your profile anytime in settings",
                                ].map((tip, index) => (
                                    <motion.li
                                        key={index}
                                        className="flex items-start gap-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8 + index * 0.05 }}
                                    >
                                        <span className="text-primary mt-1">•</span>
                                        <span>{tip}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            <Button
                                size="lg"
                                className="w-full"
                                onClick={handleGoToDashboard}
                                // whileHover={{ scale: 1.02 }}
                                // whileTap={{ scale: 0.98 }}
                                asChild
                            >
                                <motion.button>Go to Dashboard</motion.button>
                            </Button>
                        </motion.div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
