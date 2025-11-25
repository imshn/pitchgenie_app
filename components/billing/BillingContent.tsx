"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { PricingCard } from "@/components/billing/PricingCard";
import { MagicCard } from "@/components/ui/magic-card";
import { Loader2, CreditCard, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { useRazorpay } from "react-razorpay";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function BillingContent() {
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<any>({
    plan: "free",
    credits: 0,
    isUnlimited: false,
  });

  const fetchBillingInfo = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await axios.get("/api/billing/info", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBillingInfo(res.data);
    } catch (error) {
      console.error("Failed to fetch billing info", error);
      toast.error("Failed to load billing info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) fetchBillingInfo();
    });
    return () => unsub();
  }, []);

  const { Razorpay } = useRazorpay();

  const handleSubscribe = async (plan: string) => {
    try {
      setProcessingPlan(plan);
      const user = auth.currentUser;
      if (!user) {
        toast.error("Please login first");
        return;
      }
      const token = await user.getIdToken();

      // Create subscription via API
      const res = await axios.post(
        "/api/billing/create-subscription",
        { plan },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { subscriptionId } = res.data;

      if (subscriptionId) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          subscription_id: subscriptionId,
          name: "PitchGenie",
          description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
          handler: async (response: any) => {
            toast.success("Payment successful! Activating plan...");
            // Poll for activation or just fetch info
            setTimeout(() => fetchBillingInfo(), 2000);
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
        toast.error("Failed to initialize subscription");
      }

    } catch (error: any) {
      console.error("Subscription failed", error);
      toast.error(error?.response?.data?.error || "Failed to start subscription");
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Current Usage */}
      <div className="grid gap-4 md:grid-cols-2">
        <MagicCard className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Current Plan</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold capitalize">{billingInfo.plan}</span>
              {billingInfo.plan !== "free" && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Active
                </span>
              )}
            </div>
          </div>
          <CreditCard className="h-5 w-5 text-muted-foreground self-end mt-4" />
        </MagicCard>

        <MagicCard className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Available Credits</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {billingInfo.isUnlimited ? "Unlimited" : billingInfo.credits}
              </span>
              <span className="text-sm text-muted-foreground">credits</span>
            </div>
          </div>
          <Zap className="h-5 w-5 text-muted-foreground self-end mt-4" />
        </MagicCard>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <PricingCard
            title="Starter"
            price="₹1,499"
            description="For individuals just getting started."
            features={[
              "600 Credits / month",
              "Basic Email Generation",
              "LinkedIn Messages",
              "Standard Support"
            ]}
            isCurrent={billingInfo.plan === "starter"}
            onSubscribe={() => handleSubscribe("starter")}
            loading={processingPlan === "starter"}
          />

          <PricingCard
            title="Pro"
            price="₹2,499"
            description="For professionals scaling their outreach."
            features={[
              "1,500 Credits / month",
              "Advanced Email Sequences",
              "Priority Support",
              "Analytics Dashboard",
              "Export to CSV"
            ]}
            isCurrent={billingInfo.plan === "pro"}
            isPopular
            onSubscribe={() => handleSubscribe("pro")}
            loading={processingPlan === "pro"}
          />

          <PricingCard
            title="Agency"
            price="₹4,999"
            description="For teams and high-volume users."
            features={[
              "Unlimited Credits",
              "Unlimited Team Members",
              "Dedicated Account Manager",
              "Custom Integrations",
              "White-label Reports"
            ]}
            isCurrent={billingInfo.plan === "agency"}
            onSubscribe={() => handleSubscribe("agency")}
            loading={processingPlan === "agency"}
          />
        </div>
      </div>
    </div>
  );
}
