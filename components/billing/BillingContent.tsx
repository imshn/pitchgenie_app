"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { PricingCard } from "@/components/billing/PricingCard";
import { MagicCard } from "@/components/ui/magic-card";
import { Loader2, CreditCard, Zap, BarChart3, Mail, FileText, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useRazorpay } from "react-razorpay";
import type { Plan, PlanId } from "@/types/billing";
import { usePlanData } from "@/hooks/usePlanData";
import { Progress } from "@/components/ui/progress";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function BillingContent() {
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  const { data: planData, loading: loadingUserData } = usePlanData();

  // Fetch plans from Server API
  const fetchPlans = async () => {
    try {
      const res = await axios.get("/api/plansV2");
      if (res.data.plans) {
        setPlans(res.data.plans);
      }
    } catch (error) {
      console.error("Failed to fetch plans", error);
      toast.error("Failed to load plans");
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const { Razorpay } = useRazorpay();

  const handleSubscribe = async (planId: string) => {
    try {
      setProcessingPlan(planId);
      const user = auth.currentUser;
      if (!user) {
        toast.error("Please login first");
        return;
      }
      const token = await user.getIdToken();

      // Create checkout order via API (V2 with dynamic pricing)
      const res = await axios.post(
        "/api/checkoutV2",
        { planId, billingCycle: "monthly" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, amount, currency, key } = res.data;

      if (orderId) {
        const plan = plans.find(p => p.id === planId);
        const options = {
          key: key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: amount,
          currency: currency,
          name: "PitchGenie",
          description: `${plan?.name} Plan Subscription`,
          order_id: orderId,
          handler: async (response: any) => {
            toast.success("Payment successful! Activating plan...");
            // The webhook will update the backend
            setTimeout(() => window.location.reload(), 2000);
          },
          prefill: {
            name: user.displayName || "",
            email: user.email || "",
          },
          theme: {
            color: "#0F172A",
            backdrop_color: "rgba(0,0,0,0.85)"
          },
          modal: {
            ondismiss: function () {
              setProcessingPlan(null);
            }
          }
        };

        const rzp1 = new Razorpay(options as any);
        rzp1.open();
        rzp1.on("payment.failed", function (response: any) {
          toast.error(response.error.description || "Payment failed");
          setProcessingPlan(null);
        });
      } else {
        toast.error("Failed to initialize checkout");
      }

    } catch (error: any) {
      console.error("Checkout failed", error);
      toast.error(error?.response?.data?.error || "Failed to start checkout");
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loadingPlans || loadingUserData || !planData) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlanId = planData.planType;
  const { usage, remaining, planData: currentPlanDetails } = planData;

  const usageStats = [
    {
      label: "Credits",
      icon: Zap,
      used: usage.creditsUsed,
      limit: currentPlanDetails.creditLimit,
      remaining: remaining.credits,
      unit: "credits"
    },
    {
      label: "Light Scrapes",
      icon: Search,
      used: usage.lightScrapesUsed,
      limit: currentPlanDetails.scraperLightLimit,
      remaining: remaining.lightScrapes,
      unit: "light scrapes"
    },
    {
      label: "Deep Scrapes",
      icon: Search,
      used: usage.deepScrapesUsed,
      limit: currentPlanDetails.scraperDeepLimit,
      remaining: remaining.deepScrapes,
      unit: "deep scrapes"
    },
    {
      label: "Sequences",
      icon: Mail,
      used: usage.sequencesUsed,
      limit: currentPlanDetails.sequenceLimit,
      remaining: remaining.sequences,
      unit: "active"
    },
    {
      label: "Templates",
      icon: FileText,
      used: usage.templatesUsed,
      limit: currentPlanDetails.templateLimit,
      remaining: remaining.templates,
      unit: "templates"
    }
  ];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Current Plan & Usage Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <MagicCard className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Current Plan</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold">{currentPlanDetails.name}</span>
              {currentPlanId !== "free" && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Renews on {new Date(usage.resetDate).toLocaleDateString()}
            </p>
          </div>
          <CreditCard className="h-5 w-5 text-muted-foreground self-end mt-4" />
        </MagicCard>

        <MagicCard className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Usage Overview</h3>
          <div className="space-y-4">
            {usageStats.map((stat) => {
              const percentage = Math.min(100, (stat.used / stat.limit) * 100);

              return (
                <div key={stat.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <stat.icon className="h-3 w-3 text-muted-foreground" />
                      <span>{stat.label}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {stat.used} / {stat.limit}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </MagicCard>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.filter(p => p.id !== 'free').map((plan) => (
            <PricingCard
              key={plan.id}
              title={plan.name}
              price={`₹${plan.priceMonthly.toLocaleString()}`}
              description={`Upgrade to ${plan.name}`}
              features={plan.features}
              isCurrent={currentPlanId === plan.id}
              isPopular={plan.badge === "Best value"}
              badge={plan.badge || undefined}
              onSubscribe={() => handleSubscribe(plan.id)}
              loading={processingPlan === plan.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
