"use client";

import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LowCreditBannerProps {
    credits: number;
    onUpgradeClick: () => void;
    onDismiss: () => void;
}

export function LowCreditBanner({ credits, onUpgradeClick, onDismiss }: LowCreditBannerProps) {
    if (credits >= 10) return null;

    return (
        <Card className="bg-destructive/10 border-destructive/50 p-4">
            <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div>
                        <h4 className="text-sm font-semibold text-destructive">Low Credits Warning</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            You have only {credits} credits remaining. Upgrade your plan to continue generating content.
                        </p>
                    </div>
                    <Button
                        onClick={onUpgradeClick}
                        size="sm"
                        variant="destructive"
                        className="h-8"
                    >
                        Upgrade Now
                    </Button>
                </div>
                <Button
                    onClick={onDismiss}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </Card>
    );
}
