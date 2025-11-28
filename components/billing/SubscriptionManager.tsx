/**
 * Subscription Manager Component
 * 
 * Manages subscription status, pause/resume/cancel actions
 */

"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Pause, Play, XCircle, Calendar } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SubscriptionManager() {
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>("active");
    const [plan, setPlan] = useState<string>("free");
    const [nextReset, setNextReset] = useState<number | null>(null);
    const [loading, setLoading] = useState<string | null>(null);

    useEffect(() => {
        const unsubAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                const unsubDoc = onSnapshot(doc(db, "users", user.uid), (doc) => {
                    if (doc.exists()) {
                        const data = doc.data();
                        setSubscriptionId(data.razorpaySubscriptionId || null);
                        setSubscriptionStatus(data.subscriptionStatus || "active");
                        setPlan(data.plan || "free");
                        setNextReset(data.nextReset || null);
                    }
                });
                return () => unsubDoc();
            }
        });
        return () => unsubAuth();
    }, []);

    const handlePause = async () => {
        setLoading("pause");
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");

            const token = await user.getIdToken();
            await axios.post(
                "/api/billing/pause-subscription",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Subscription paused successfully");
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to pause subscription");
        } finally {
            setLoading(null);
        }
    };

    const handleResume = async () => {
        setLoading("resume");
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");

            const token = await user.getIdToken();
            await axios.post(
                "/api/billing/resume-subscription",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Subscription resumed successfully");
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to resume subscription");
        } finally {
            setLoading(null);
        }
    };

    const handleCancel = async () => {
        setLoading("cancel");
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");

            const token = await user.getIdToken();
            await axios.post(
                "/api/billing/cancel-subscription",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Subscription cancelled. You'll retain access until your billing period ends.");
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to cancel subscription");
        } finally {
            setLoading(null);
        }
    };

    // Don't show for free plan
    if (plan === "free" || !subscriptionId) {
        return null;
    }

    const nextBillingDate = (() => {
        if (!nextReset) return "N/A";
        try {
            const dateValue: any = nextReset;
            let dateObj: Date;

            if (dateValue.toDate && typeof dateValue.toDate === 'function') {
                dateObj = dateValue.toDate();
            } else if (dateValue._seconds !== undefined) {
                dateObj = new Date(dateValue._seconds * 1000);
            } else {
                dateObj = new Date(dateValue);
            }

            return dateObj.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            });
        } catch (e) {
            return "Invalid Date";
        }
    })();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Subscription Management
                    <Badge variant={subscriptionStatus === "active" ? "default" : "secondary"}>
                        {subscriptionStatus}
                    </Badge>
                </CardTitle>
                <CardDescription>
                    Manage your subscription, pause, or cancel anytime
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Next billing date:</span>
                        <span className="font-medium">{nextBillingDate}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {subscriptionStatus === "active" && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handlePause}
                                disabled={loading !== null}
                                className="flex-1"
                            >
                                <Pause className="h-4 w-4 mr-2" />
                                {loading === "pause" ? "Pausing..." : "Pause Subscription"}
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        disabled={loading !== null}
                                        className="flex-1"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancel Subscription
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will cancel your subscription at the end of the current billing period.
                                            You'll retain access to all features until {nextBillingDate}.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleCancel} className="bg-destructive">
                                            {loading === "cancel" ? "Cancelling..." : "Yes, Cancel"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}

                    {subscriptionStatus === "paused" && (
                        <Button
                            onClick={handleResume}
                            disabled={loading !== null}
                            className="w-full"
                        >
                            <Play className="h-4 w-4 mr-2" />
                            {loading === "resume" ? "Resuming..." : "Resume Subscription"}
                        </Button>
                    )}
                </div>

                {subscriptionStatus === "paused" && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-yellow-600 dark:text-yellow-500">Subscription Paused</p>
                            <p className="text-muted-foreground mt-1">
                                Your subscription is currently paused. Resume anytime to continue receiving credits.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
