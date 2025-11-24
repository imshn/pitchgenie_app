"use client";

import AuthGuard from "@/components/AuthGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { MagicCard } from "@/components/ui/magic-card";
import { Users, Mail, Reply, TrendingUp, Activity, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import AnalyticsPage from "@/app/dashboard/analytics/page";

export default function DashboardPage() {
  return <AuthGuard><AnalyticsPage /></AuthGuard>;
}
