"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Check, Zap, TrendingUp, Users, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_CONFIGS, PlanType } from "@/lib/credit-types";
import { auth } from "@/lib/firebase";
import axios from "axios";
import toast from "react-hot-toast";

interface UpgradePlanModalProps {
    open: boolean;
    onClose: () => void;
    currentPlan: PlanType;
}

const planFeatures = {
    free: [
        "50 credits per month",
        "1 credit per email",
        "3 scrapers per month",
        "Basic support",
    ],
    starter: [
        "600 credits per month",
        "Unlimited scrapers",
        "Priority email support",
        "Custom templates",
    ],
    pro: [
        "1,500 credits per month",
        "Unlimited scrapers",
        "Priority support",
        "Advanced analytics",
        "Custom templates",
    ],
    agency: [
        "Unlimited credits",
        "Unlimited everything",
        "Dedicated support",
        "White-label options",
        "API access",
    ],
};

export function UpgradePlanModal({ open, onClose, currentPlan }: UpgradePlanModalProps) {
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

    const handleUpgrade = async (plan: PlanType) => {
        if (plan === currentPlan) {
            toast.error("You're already on this plan");
            return;
        }

        if (plan === "free") {
            toast.error("Cannot downgrade to free plan from here");
            return;
        }

        setSelectedPlan(plan);
        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error("Please sign in");
                return;
            }

            const token = await user.getIdToken();

            // TODO: RAZORPAY INTEGRATION
            // This is where you'll integrate Razorpay checkout
            // 1. Create Razorpay order for the plan
            // 2. Open Razorpay checkout modal
            // 3. On successful payment, webhook will trigger plan update
            // 
            // For now, we'll directly update the plan (for testing only)
            // Remove this in production and use payment-verified webhook

            await axios.post(
                "/api/plan/update",
                {
                    uid: user.uid,
                    plan,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success(`Upgraded to ${PLAN_CONFIGS[plan].name} plan!`);
            onClose();
        } catch (error: any) {
            console.error("Upgrade error:", error);
            toast.error(error?.response?.data?.error || "Upgrade failed");
        } finally {
            setLoading(false);
            setSelectedPlan(null);
        }
    };

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 scale-95"
                            enterTo="opacity-100 translate-y-0 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 scale-100"
                            leaveTo="opacity-0 translate-y-4 scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-background border border-border shadow-xl transition-all w-full max-w-5xl">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-border">
                                    <div>
                                        <Dialog.Title className="text-2xl font-bold text-foreground">
                                            Upgrade Your Plan
                                        </Dialog.Title>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Choose the perfect plan for your outreach needs
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Plans Grid */}
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {(Object.keys(PLAN_CONFIGS) as PlanType[]).map((plan) => {
                                        const config = PLAN_CONFIGS[plan];
                                        const features = planFeatures[plan];
                                        const isCurrent = plan === currentPlan;
                                        const isPopular = plan === "pro";

                                        return (
                                            <Card
                                                key={plan}
                                                className={`relative ${isPopular ? "border-primary shadow-lg" : ""
                                                    } ${isCurrent ? "bg-secondary/20" : ""}`}
                                            >
                                                {isPopular && (
                                                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                                                        Popular
                                                    </Badge>
                                                )}
                                                <CardHeader>
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-xl capitalize">{config.name}</CardTitle>
                                                        {isCurrent && (
                                                            <Badge variant="secondary">Current</Badge>
                                                        )}
                                                    </div>
                                                    <CardDescription className="text-3xl font-bold mt-2">
                                                        ₹{config.price.toLocaleString()}
                                                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                                        {plan === "agency" ? (
                                                            <><InfinityIcon className="h-4 w-4 text-primary" /> Unlimited</>
                                                        ) : (
                                                            <><Zap className="h-4 w-4 text-primary" /> {config.monthlyCredits} credits/mo</>
                                                        )}
                                                    </div>
                                                    <ul className="space-y-2">
                                                        {features.map((feature, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                                <span>{feature}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {plan !== "free" && (
                                                        <Button
                                                            onClick={() => handleUpgrade(plan)}
                                                            disabled={isCurrent || loading}
                                                            className="w-full mt-4"
                                                            variant={isPopular ? "default" : "outline"}
                                                        >
                                                            {loading && selectedPlan === plan ? (
                                                                "Processing..."
                                                            ) : isCurrent ? (
                                                                "Current Plan"
                                                            ) : (
                                                                "Upgrade Now"
                                                            )}
                                                        </Button>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>

                                {/* Footer Note */}
                                <div className="px-6 py-4 bg-secondary/20 border-t border-border">
                                    <p className="text-xs text-center text-muted-foreground">
                                        All prices in INR. Credits refresh monthly. Cancel anytime.
                                    </p>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
