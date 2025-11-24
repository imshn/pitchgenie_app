"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Zap, TrendingUp } from "lucide-react";
import { PLAN_CONFIGS, PlanType } from "@/lib/credit-types";

interface CreditDisplayProps {
    onUpgradeClick?: () => void;
}

export function CreditDisplay({ onUpgradeClick }: CreditDisplayProps) {
    const [credits, setCredits] = useState<number | null>(null);
    const [maxCredits, setMaxCredits] = useState<number>(50);
    const [plan, setPlan] = useState<PlanType>("free");
    const [nextReset, setNextReset] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(
            doc(db, "users", user.uid),
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setCredits(data.credits ?? 50);
                    setMaxCredits(data.maxCredits ?? 50);
                    setPlan(data.plan ?? "free");
                    setNextReset(data.nextReset ?? 0);
                }
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching credits:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <Card className="bg-card/50 border-border">
                <CardContent className="p-4">
                    <div className="h-24 flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">Loading...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isAgency = plan === "agency";
    const percentage = isAgency ? 100 : maxCredits > 0 ? (credits! / maxCredits) * 100 : 0;
    const isLow = !isAgency && credits! < 10;
    const planConfig = PLAN_CONFIGS[plan];

    const daysUntilReset = nextReset
        ? Math.ceil((nextReset - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

    return (
        <Card className="bg-gradient-to-br from-card/80 to-card/40 border-border">
            <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-muted-foreground">Credits</div>
                            <div className="text-lg font-bold">
                                {isAgency ? (
                                    <span className="flex items-center gap-1">
                                        <span>∞</span>
                                        <span className="text-sm font-normal text-muted-foreground">Unlimited</span>
                                    </span>
                                ) : (
                                    <span>
                                        {credits}/{maxCredits}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <Badge variant={plan === "free" ? "secondary" : "default"} className="capitalize">
                        {planConfig.name}
                    </Badge>
                </div>

                {/* Progress Bar */}
                {!isAgency && (
                    <div className="space-y-1">
                        <Progress
                            value={percentage}
                            className={`h-2 ${isLow ? "bg-destructive/20" : ""}`}
                        />
                        {isLow && (
                            <p className="text-xs text-destructive">Low credits! Consider upgrading.</p>
                        )}
                    </div>
                )}

                {/* Reset Info */}
                {!isAgency && daysUntilReset > 0 && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Resets in {daysUntilReset} days</span>
                        <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{maxCredits} credits</span>
                        </div>
                    </div>
                )}

                {/* Upgrade Button */}
                {plan !== "agency" && onUpgradeClick && (
                    <Button
                        onClick={onUpgradeClick}
                        size="sm"
                        className="w-full"
                        variant={isLow ? "default" : "outline"}
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Upgrade Plan
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
