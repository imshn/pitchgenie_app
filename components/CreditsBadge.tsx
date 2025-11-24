/**
 * CreditsBadge Component
 * 
 * Displays user's current plan, credits, and next reset date
 * Real-time updates via Firestore listener
 */

"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Zap, Calendar } from "lucide-react";
import { PLAN_CONFIGS } from "@/lib/credit-types";
import type { PlanType } from "@/lib/credit-types";

export function CreditsBadge() {
  const [plan, setPlan] = useState<PlanType>("free");
  const [credits, setCredits] = useState<number>(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [nextReset, setNextReset] = useState<number | null>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const unsubDoc = onSnapshot(doc(db, "users", user.uid), (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setPlan(data.plan || "free");
            setCredits(data.credits || 0);
            setIsUnlimited(data.isUnlimited || false);
            setNextReset(data.nextReset || null);
          }
        });
        return () => unsubDoc();
      }
    });
    return () => unsubAuth();
  }, []);

  const planConfig = PLAN_CONFIGS[plan];
  const daysUntilReset = nextReset
    ? Math.ceil((nextReset - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold capitalize">{plan} Plan</span>
            {plan !== "free" && (
              <Badge variant="default" className="text-xs">
                Active
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {isUnlimited
              ? "Unlimited Credits"
              : `${credits.toLocaleString()} / ${planConfig.maxCredits.toLocaleString()} credits`}
          </div>
        </div>
      </div>

      {daysUntilReset && daysUntilReset > 0 && (
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{daysUntilReset}d reset</span>
        </div>
      )}
    </div>
  );
}
