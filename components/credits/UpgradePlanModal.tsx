"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Check, Zap, Infinity as InfinityIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanType } from "@/lib/credit-types";
import { PlanDocument } from "@/lib/types/plans";
import { auth } from "@/lib/firebase";
import axios from "axios";
import toast from "react-hot-toast";
import { useRazorpay } from "react-razorpay";

interface UpgradePlanModalProps {
    open: boolean;
    onClose: () => void;
    currentPlan: PlanType;
}

export function UpgradePlanModal({ open, onClose, currentPlan }: UpgradePlanModalProps) {
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
    const [plans, setPlans] = useState<PlanDocument[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    const { Razorpay } = useRazorpay();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await axios.get("/api/plansV2");
                if (res.data.plans) {
                    setPlans(res.data.plans);
                }
            } catch (error) {
                console.error("Failed to fetch plans", error);
                toast.error("Failed to load plan details");
            } finally {
                setLoadingPlans(false);
            }
        };

        if (open) {
            fetchPlans();
        }
    }, [open]);

    const handleUpgrade = async (planId: PlanType) => {
        if (planId === currentPlan) {
            toast.error("You're already on this plan");
            return;
        }

        if (planId === "free") {
            toast.error("Cannot downgrade to free plan from here");
            return;
        }

        setSelectedPlan(planId);
        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error("Please sign in");
                return;
            }

            const token = await user.getIdToken();

            // Create subscription via API
            const res = await axios.post(
                "/api/billing/create-subscription",
                { plan: planId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { subscriptionId } = res.data;

            if (subscriptionId) {
                const planDetails = plans.find(p => p.id === planId);
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    subscription_id: subscriptionId,
                    name: "PitchGenie",
                    description: `${planDetails?.name || planId} Plan Subscription`,
                    handler: async (response: any) => {
                        toast.success(`Upgraded to ${planDetails?.name || planId} plan!`);
                        onClose();
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
                            setLoading(false);
                            setSelectedPlan(null);
                        }
                    }
                };

                const rzp1 = new Razorpay(options as any);
                rzp1.open();
                rzp1.on("payment.failed", function (response: any) {
                    toast.error(response.error.description || "Payment failed");
                    setLoading(false);
                    setSelectedPlan(null);
                });
            } else {
                toast.error("Failed to initialize subscription");
                setLoading(false);
                setSelectedPlan(null);
            }

        } catch (error: any) {
            console.error("Upgrade error:", error);
            toast.error(error?.response?.data?.error || "Upgrade failed");
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
                                <div className="p-6">
                                    {loadingPlans ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {plans.map((plan) => {
                                                const isCurrent = plan.id === currentPlan;
                                                const isPopular = plan.badge === "Best value" || plan.badge === "Popular";

                                                return (
                                                    <Card
                                                        key={plan.id}
                                                        className={`relative flex flex-col ${isPopular ? "border-primary shadow-lg" : ""
                                                            } ${isCurrent ? "bg-secondary/20" : ""}`}
                                                    >
                                                        {isPopular && (
                                                            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                                                                {plan.badge || "Popular"}
                                                            </Badge>
                                                        )}
                                                        <CardHeader>
                                                            <div className="flex items-center justify-between">
                                                                <CardTitle className="text-xl capitalize">{plan.name}</CardTitle>
                                                                {isCurrent && (
                                                                    <Badge variant="secondary">Current</Badge>
                                                                )}
                                                            </div>
                                                            <CardDescription className="text-3xl font-bold mt-2">
                                                                ₹{plan.priceMonthly.toLocaleString()}
                                                                <span className="text-sm font-normal text-muted-foreground">/mo</span>
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-4 flex-1 flex flex-col">
                                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                                {plan.id === "agency" ? (
                                                                    <><InfinityIcon className="h-4 w-4 text-primary" /> Unlimited credits</>
                                                                ) : (
                                                                    <><Zap className="h-4 w-4 text-primary" /> {plan.creditLimit} credits/mo</>
                                                                )}
                                                            </div>
                                                            <ul className="space-y-2 flex-1">
                                                                {plan.features.map((feature, i) => (
                                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                                        <span>{feature}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            {plan.id !== "free" && (
                                                                <Button
                                                                    onClick={() => handleUpgrade(plan.id)}
                                                                    disabled={isCurrent || loading}
                                                                    className="w-full mt-4"
                                                                    variant={isPopular ? "default" : "outline"}
                                                                >
                                                                    {loading && selectedPlan === plan.id ? (
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
                                    )}
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
