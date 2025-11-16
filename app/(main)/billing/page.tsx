/* eslint-disable @typescript-eslint/no-explicit-any */
// app/billing/page.tsx
"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";

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
    <div className="p-10 mx-30 text-white">
      <h1 className="text-3xl font-bold mb-4">Pricing (INR)</h1>

      <div className="text-gray-300 mb-8">
        <div>Current Plan: <b className="capitalize">{planInfo?.plan || "loading..."}</b></div>
        <div>Credits: <b>{planInfo?.credits ?? "--"}</b></div>
      </div>

      <div className="flex gap-6">
        <div className="p-6 border border-white/10 rounded-xl bg-white/5 w-72">
          <h2 className="text-xl font-bold">Starter</h2>
          <p className="text-2xl mt-2">₹1,499/mo</p>
          <ul className="mt-3 text-gray-300 text-sm space-y-1">
            <li>• 600 credits</li>
            <li>• 2 seats</li>
            <li>• Scraper (uses credits)</li>
          </ul>

          <button className="w-full mt-5 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500" onClick={() => subscribe("starter")} disabled={loadingPlan === "starter"}>
            {loadingPlan === "starter" ? "Processing..." : "Subscribe"}
          </button>
        </div>

        <div className="p-6 border border-white/10 rounded-xl bg-white/5 w-72">
          <h2 className="text-xl font-bold">Pro</h2>
          <p className="text-2xl mt-2">₹2,499/mo</p>
          <ul className="mt-3 text-gray-300 text-sm space-y-1">
            <li>• 1500 credits</li>
            <li>• 5 seats</li>
            <li>• Deep scraper</li>
          </ul>

          <button className="w-full mt-5 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500" onClick={() => subscribe("pro")} disabled={loadingPlan === "pro"}>
            {loadingPlan === "pro" ? "Processing..." : "Subscribe"}
          </button>
        </div>

        <div className="p-6 border border-white/10 rounded-xl bg-white/5 w-72">
          <h2 className="text-xl font-bold">Agency</h2>
          <p className="text-2xl mt-2">₹4,999/mo</p>
          <ul className="mt-3 text-gray-300 text-sm space-y-1">
            <li>• Unlimited credits</li>
            <li>• Unlimited team</li>
            <li>• Priority support</li>
          </ul>

          <button className="w-full mt-5 px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-500" onClick={() => subscribe("agency")} disabled={loadingPlan === "agency"}>
            {loadingPlan === "agency" ? "Processing..." : "Subscribe"}
          </button>
        </div>
      </div>
    </div>
  );
}