/**
 * Action Breakdown Chart Component
 *
 * Shows credit usage by action type (pie chart)
 */

"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";

const COLORS = {
    email: "hsl(var(--primary))",
    linkedin: "hsl(var(--chart-2))",
    sequence: "hsl(var(--chart-3))",
    scraper: "hsl(var(--chart-4))",
    deliverability: "hsl(var(--chart-5))",
};

export function ActionBreakdownChart() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActionData();
    }, []);

    const fetchActionData = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            const eventsRef = collection(db, `users/${user.uid}/events`);
            const q = query(
                eventsRef,
                where("type", "==", "credits_deducted"),
                where("timestamp", ">=", thirtyDaysAgo)
            );

            const snapshot = await getDocs(q);
            const events = snapshot.docs.map((doc) => doc.data());

            // Group by action type
            const actionTotals: Record<string, number> = {};
            events.forEach((event: any) => {
                const type = event.actionType || "other";
                actionTotals[type] = (actionTotals[type] || 0) + (event.cost || 0);
            });

            const chartData = Object.entries(actionTotals).map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value,
                fill: COLORS[name as keyof typeof COLORS] || "hsl(var(--muted))",
            }));

            setData(chartData);
        } catch (error) {
            console.error("Failed to fetch action data:", error);
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
                    <CardTitle>Action Breakdown</CardTitle>
                    <CardDescription>last 30 days</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-12">
                    No action data yet
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Action Breakdown</CardTitle>
                <CardDescription>Credits used by action type (last 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                                `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            outerRadius={80}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                            }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
