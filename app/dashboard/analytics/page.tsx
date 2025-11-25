"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2, Mail, Users, CreditCard, Repeat, Database, Send } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useAuth } from "@/app/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface Summary {
  leads_total?: number;
  emails_generated_total?: number;
  sequences_generated_total?: number;
  scrapes_total?: number;
  emails_sent_total?: number;
  credits_used_total?: number;
  updatedAt?: number;
}

interface Event {
  id: string;
  type: string;
  leadId?: string | null;
  cost?: number | null;
  timestamp: number;
  meta?: Record<string, any>;
}

interface TimeSeriesEntry {
  date: string;
  email_generated: number;
  email_sent: number;
  sequence_generated: number;
  scraper_run: number;
  credits_used: number;
}

const chartConfig = {
  email_generated: {
    label: "Emails Generated",
    color: "hsl(var(--chart-1))",
  },
  email_sent: {
    label: "Emails Sent",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

import { TourTrigger } from "@/components/tour/TourTrigger";

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [timeseries, setTimeSeries] = useState<TimeSeriesEntry[]>([]);
  const [recent, setRecent] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const res = await axios.get("/api/analytics/summary", {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        });
        const { summary, timeseries, recent } = res.data;
        setSummary(summary);
        setTimeSeries(timeseries);
        setRecent(recent);
      } catch (e: any) {
        console.error(e);
        setError(e?.response?.data?.error || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-12 h-12 text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <p className="text-lg">Please sign in to view analytics.</p>
        <Button onClick={() => router.push("/login")}>Go to Sign‑In</Button>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center mt-8">{error}</p>;
  }

  return (
    <div className="flex flex-col h-full">
      <TourTrigger />
      <PageHeader
        title="Analytics Dashboard"
        description="Overview of your lead generation performance."
        data-tour="analytics"
      >
        <Button variant="outline" onClick={() => router.push("/upload")} data-tour="upload">
          Upload Leads
        </Button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-auto space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.leads_total ?? 0}</div>
              <p className="text-xs text-muted-foreground">Imported or added</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Generated</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.emails_generated_total ?? 0}</div>
              <p className="text-xs text-muted-foreground">AI drafted emails</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sequences</CardTitle>
              <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.sequences_generated_total ?? 0}</div>
              <p className="text-xs text-muted-foreground">Multi-step campaigns</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scrapers Run</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.scrapes_total ?? 0}</div>
              <p className="text-xs text-muted-foreground">Data collection jobs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.emails_sent_total ?? 0}</div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.credits_used_total ?? 0}</div>
              <p className="text-xs text-muted-foreground">Total consumption</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>
                Performance trends for the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeseries.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No activity data available
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                  <AreaChart
                    accessibilityLayer
                    data={timeseries}
                    margin={{
                      left: 12,
                      right: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            return new Date(value).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            });
                          }}
                        />
                      }
                    />
                    <defs>
                      <linearGradient id="fillEmailGenerated" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-email_generated)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-email_generated)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient id="fillEmailSent" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-email_sent)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-email_sent)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      dataKey="email_sent"
                      type="natural"
                      fill="url(#fillEmailSent)"
                      fillOpacity={0.4}
                      stroke="var(--color-email_sent)"
                      stackId="a"
                    />
                    <Area
                      dataKey="email_generated"
                      type="natural"
                      fill="url(#fillEmailGenerated)"
                      fillOpacity={0.4}
                      stroke="var(--color-email_generated)"
                      stackId="a"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col h-[420px]">
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Latest system activities</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              {recent.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No recent events
                </div>
              ) : (
                <ScrollArea className="h-full w-full">
                  <div className="space-y-4 p-4">
                    {recent.map((ev) => (
                      <div key={ev.id} className="flex items-start justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{ev.type.replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(ev.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {ev.cost && (
                            <Badge variant="secondary" className="text-[10px]">
                              {ev.cost} credits
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
