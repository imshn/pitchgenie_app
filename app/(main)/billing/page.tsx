/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { Check, Zap } from 'lucide-react';

const plans = [
  {
    name: "Starter",
    price: "₹1,499",
    period: "month",
    description: "Perfect for getting started",
    features: ["600 credits", "2 seats", "Scraper (uses credits)", "Basic support"],
    id: "starter",
  },
  {
    name: "Pro",
    price: "₹2,499",
    period: "month",
    description: "For growing teams",
    features: ["1500 credits", "5 seats", "Deep scraper", "Priority support", "Custom templates"],
    id: "pro",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "₹4,999",
    period: "month",
    description: "For agencies & enterprises",
    features: ["Unlimited credits", "Unlimited team", "Priority support", "API access", "Dedicated account manager"],
    id: "agency",
  },
];

export default function BillingPage() {
  const [user, setUser] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [planInfo, setPlanInfo] = useState<any>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (!u) return;
      const token = await u.getIdToken();
      const res = await axios.get("/api/billing/info", { headers: { Authorization: `Bearer ${token}` } });
      setPlanInfo(res.data);
    });
    return () => unsub();
  }, []);

  const subscribe = async (plan: string) => {
    try {
      if (!user) return alert("Please login first.");
      setLoadingPlan(plan);
      const token = await user.getIdToken();
      const res = await axios.post("/api/billing/create-subscription", { plan }, { headers: { Authorization: `Bearer ${token}` } });
      const shortUrl = res.data?.short_url || res.data?.subscription?.short_url;
      if (!shortUrl) {
        console.error("Missing short_url:", res.data);
        alert("Checkout link missing. Check console.");
        return;
      }
      const link = document.createElement("a");
      link.href = shortUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error("Subscription Error:", err);
      alert(err?.response?.data?.error || "Failed to create subscription");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main className="pl-64 min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-2">Billing & Plans</h1>
          <p className="text-muted-foreground">Choose the perfect plan for your business</p>
        </div>

        {planInfo && (
          <div className="glass border border-border rounded-lg p-6 mb-8 shadow-premium">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                <p className="text-2xl font-semibold text-foreground capitalize mt-1">{planInfo?.plan || "Free"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Credits Available</p>
                <p className="text-2xl font-semibold text-primary mt-1">{planInfo?.credits ?? "—"}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative glass border rounded-lg overflow-hidden shadow-premium transition-all duration-150 hover:shadow-glow ${
                plan.highlighted ? "ring-2 ring-primary md:scale-105" : "border-border hover:border-primary/30"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 bg-primary/20 border-b border-primary/30 px-4 py-2 text-center">
                  <p className="text-xs font-semibold text-primary">MOST POPULAR</p>
                </div>
              )}

              <div className={`p-8 ${plan.highlighted ? "pt-16" : ""}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                  <div className="p-2 bg-primary/15 rounded-lg">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-3xl font-bold text-foreground">{plan.price}</p>
                  <p className="text-sm text-muted-foreground">per {plan.period}</p>
                </div>

                <button
                  onClick={() => subscribe(plan.id)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 border mb-6 ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary/30"
                      : "bg-secondary/60 text-foreground hover:bg-secondary border-border"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loadingPlan === plan.id ? "Processing..." : "Subscribe Now"}
                </button>

                <div className="space-y-3 pt-6 border-t border-border">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
