"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Loader2, Mail, Users, CreditCard, Repeat, Database, Send, CheckCircle, Eye, MessageSquare, Percent } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  deliverability_checks_total?: number;
  emails_opened_total?: number;
  emails_replied_total?: number;
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
  deliverability_check: number;
  email_opened: number;
  email_replied: number;
}

const chartConfig = {
  email_generated: {
    label: "Emails Generated",
    color: "#D6B9FC",
  },
  email_sent: {
    label: "Emails Sent",
    color: "#838CE5",
  },
  email_opened: {
    label: "Emails Opened",
    color: "#34D399", // Emerald 400
  },
  email_replied: {
    label: "Replies",
    color: "#F472B6", // Pink 400
  },
  open_rate: {
    label: "Open Rate",
    color: "#34D399",
  },
  reply_rate: {
    label: "Reply Rate",
    color: "#F472B6",
  },
  deliverability_check: {
    label: "Optimizations",
    color: "#FBBF24", // Amber 400
  },
} satisfies ChartConfig;

import { TourTrigger } from "@/components/tour/TourTrigger";
import { Bar, BarChart, Line, LineChart } from "recharts";

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
        // 1. Get browser timezone as default
        let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // 2. Try to fetch user profile for saved timezone
        try {
          const profileRes = await axios.get("/api/profile/get", {
            headers: { Authorization: `Bearer ${await user.getIdToken()}` },
          });
          if (profileRes.data?.profile?.timezone) {
            timezone = profileRes.data.profile.timezone;
          }
        } catch (err) {
          console.warn("Failed to fetch profile timezone, using browser default", err);
        }

        const res = await axios.get("/api/analytics/summary", {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
          params: { timezone },
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

  // Calculate Rates
  const emailsSent = summary?.emails_sent_total ?? 0;
  const emailsGenerated = summary?.emails_generated_total ?? 0;
  const emailsOpened = summary?.emails_opened_total ?? 0;
  const emailsReplied = summary?.emails_replied_total ?? 0;

  const deliveryRate = emailsGenerated > 0 ? Math.min(100, Math.round((emailsSent / emailsGenerated) * 100)) : 0;
  const openRate = emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0;
  const replyRate = emailsSent > 0 ? Math.round((emailsReplied / emailsSent) * 100) : 0;

  // Enhance timeseries with calculated rates for charts
  const chartData = timeseries.map(item => ({
    ...item,
    open_rate: item.email_sent > 0 ? Math.round((item.email_opened / item.email_sent) * 100) : 0,
    reply_rate: item.email_sent > 0 ? Math.round((item.email_replied / item.email_sent) * 100) : 0,
  }));

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Row 1: Core Metrics */}
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

          {/* Row 2: Performance Rates & Tools */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openRate}%</div>
              <p className="text-xs text-muted-foreground">Emails opened</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{replyRate}%</div>
              <p className="text-xs text-muted-foreground">Responses received</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveryRate}%</div>
              <p className="text-xs text-muted-foreground">Generated vs Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deliverability Checks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.deliverability_checks_total ?? 0}</div>
              <p className="text-xs text-muted-foreground">Optimizations run</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <Card className="flex-1 flex flex-col h-[400px]">
            <CardHeader className="pb-2">
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>
                Performance trends for the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 px-2 pb-2 min-h-0">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No activity data available
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                      left: 12,
                      right: 12,
                      top: 10,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <YAxis padding={{ top: 30, bottom: 20 }} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={4}
                      minTickGap={32}
                      padding={{ left: 12, right: 24 }}
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
                      <linearGradient id="fillEmailOpened" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-email_opened)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-email_opened)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient id="fillEmailReplied" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-email_replied)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-email_replied)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      dataKey="email_sent"
                      type="monotone"
                      fill="url(#fillEmailSent)"
                      fillOpacity={0.4}
                      stroke="var(--color-email_sent)"
                      stackId="a"
                    />
                    <Area
                      dataKey="email_generated"
                      type="monotone"
                      fill="url(#fillEmailGenerated)"
                      fillOpacity={0.4}
                      stroke="var(--color-email_generated)"
                      stackId="a"
                    />
                    <Area
                      dataKey="email_opened"
                      type="monotone"
                      fill="url(#fillEmailOpened)"
                      fillOpacity={0.4}
                      stroke="var(--color-email_opened)"
                      stackId="a"
                    />
                    <Area
                      dataKey="email_replied"
                      type="monotone"
                      fill="url(#fillEmailReplied)"
                      fillOpacity={0.4}
                      stroke="var(--color-email_replied)"
                      stackId="a"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Engagement Trends */}
          <Card className="flex-1 flex flex-col h-[400px]">
            <CardHeader className="pb-2">
              <CardTitle>Engagement Trends</CardTitle>
              <CardDescription>Daily open and reply rates</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 px-2 pb-2 min-h-0">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart
                    accessibilityLayer
                    data={chartData}
                    margin={{ left: 12, right: 12, top: 10, bottom: 5 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={4}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          }}
                        />
                      }
                    />
                    <Line
                      dataKey="open_rate"
                      type="monotone"
                      stroke="var(--color-open_rate)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      dataKey="reply_rate"
                      type="monotone"
                      stroke="var(--color-reply_rate)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Deliverability Optimizations */}
          <Card className="flex-1 flex flex-col h-[400px]">
            <CardHeader className="pb-2">
              <CardTitle>Deliverability Optimizations</CardTitle>
              <CardDescription>Daily checks run</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 px-2 pb-2 min-h-0">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart
                    accessibilityLayer
                    data={chartData}
                    margin={{ left: 12, right: 12, top: 10, bottom: 5 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={4}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => {
                            return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          }}
                        />
                      }
                    />
                    <Bar
                      dataKey="deliverability_check"
                      fill="var(--color-deliverability_check)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Events - Full Width */}
        <Card className="flex flex-col h-[400px]">
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
                        <p className="text-sm font-medium leading-none capitalize">{ev.type.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ev.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {ev.cost !== undefined && ev.cost !== null && (
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
  );
}
