/**
 * Credit Usage Chart Component
 * 
 * Shows credit usage over time with line chart
 */

"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

export function CreditUsageChart() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsageData();
    }, []);

    const fetchUsageData = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            // Get last 30 days of credit deduction events
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

            const eventsRef = collection(db, `users/${user.uid}/events`);
            const q = query(
                eventsRef,
                where("type", "==", "credits_deducted"),
                where("timestamp", ">=", thirtyDaysAgo),
                orderBy("timestamp", "asc")
            );

            const snapshot = await getDocs(q);
            const events = snapshot.docs.map(doc => doc.data());

            // Group by day
            const dailyUsage: Record<string, number> = {};
            events.forEach((event: any) => {
                const date = new Date(event.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                });
                dailyUsage[date] = (dailyUsage[date] || 0) + (event.cost || 0);
            });

            // Convert to chart data
            const chartData = Object.entries(dailyUsage).map(([date, credits]) => ({
                date,
                credits,
            }));

            setData(chartData);
        } catch (error) {
            console.error("Failed to fetch usage data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center min-h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Credit Usage</CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-12">
                    No usage data yet
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Credit Usage</CardTitle>
                <CardDescription>Daily credit consumption over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="credits"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
