/**
 * Onboarding Step 3: Billing Selection
 * Enhanced with plan card glow and bounce animations
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import axios from "axios";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { AnimatedBackground } from "@/components/onboarding/AnimatedBackground";
import { PlanCard } from "@/components/onboarding/PlanCard";
import { PLAN_CONFIGS } from "@/lib/credit-types";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRazorpay } from "react-razorpay";

export default function OnboardingStep3() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<"free" | "starter" | "pro" | "agency">("free");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
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

            if (res.data.onboardingCompleted) {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Failed to fetch onboarding status:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = async () => {
        if (selectedPlan === "free") {
            await handleFreePlan();
        } else {
            await handlePaidPlan();
        }
    };

    const handleFreePlan = async () => {
        setProcessing(true);
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();
            await axios.post(
                "/api/onboarding/complete",
                { plan: "free" },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            router.push("/onboarding/success");
        } catch (error) {
            toast.error("Failed to complete setup");
            setProcessing(false);
        }
    };

    const { Razorpay } = useRazorpay();

    const handlePaidPlan = async () => {
        setProcessing(true);
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();

            const res = await axios.post(
                "/api/billing/create-subscription",
                { plan: selectedPlan },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { subscriptionId } = res.data;

            if (subscriptionId) {
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    subscription_id: subscriptionId,
                    name: "PitchGenie",
                    description: `${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan Subscription`,
                    handler: async (response: any) => {
                        // Handle success
                        await axios.post(
                            "/api/onboarding/update",
                            { onboardingStep: 3 },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        router.push("/onboarding/success");
                    },
                    prefill: {
                        name: user.displayName || "",
                        email: user.email || "",
                    },
                    theme: {
                        color: "#0F172A",
                        backdrop_color: "rgba(0,0,0,0.85)"
                    },
                    image: "https://pitchgenie.ai/logo.png",
                    modal: {
                        ondismiss: function () {
                            setProcessing(false);
                        }
                    }
                };

                const rzp1 = new Razorpay(options as any);
                rzp1.open();
                rzp1.on("payment.failed", function (response: any) {
                    toast.error(response.error.description || "Payment failed");
                    setProcessing(false);
                });
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to create subscription");
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const [plans, setPlans] = useState<any[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await axios.get("/api/plans");
                if (res.data.plans) {
                    setPlans(res.data.plans);
                }
            } catch (error) {
                console.error("Failed to fetch plans:", error);
                toast.error("Failed to load plans");
            } finally {
                setLoadingPlans(false);
            }
        };
        fetchPlans();
    }, []);

    if (loadingPlans) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 py-12 relative">
            <AnimatedBackground />

            <div className="w-full max-w-6xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ProgressIndicator currentStep={3} />
                </motion.div>

                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
                    <p className="text-muted-foreground">
                        Start with Free or unlock more features with a paid plan
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                        >
                            <PlanCard
                                name={plan.name}
                                price={plan.priceMonthly}
                                credits={plan.creditLimit}
                                scraperLimit={plan.scraperLimit}
                                features={plan.features}
                                isSelected={selectedPlan === plan.id}
                                isRecommended={plan.badge === "Best value"}
                                onSelect={() => setSelectedPlan(plan.id)}
                            />
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle>Ready to get started?</CardTitle>
                            <CardDescription>
                                {selectedPlan === "free"
                                    ? "You can upgrade anytime from your billing settings"
                                    : `You'll be redirected to Razorpay to complete payment for the ${selectedPlan} plan`}
                            </CardDescription>
                        </CardHeader>
                        <div className="p-6 pt-0">
                            <Button
                                size="lg"
                                className="w-full"
                                onClick={handleSelectPlan}
                                disabled={processing}
                                asChild
                            >
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {selectedPlan === "free" ? "Setting up..." : "Redirecting to payment..."}
                                        </>
                                    ) : selectedPlan === "free" ? (
                                        "Start with Free Plan"
                                    ) : (
                                        "Continue to Payment"
                                    )}
                                </motion.button>
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
