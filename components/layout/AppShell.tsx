"use client";

import { SideNav } from "@/components/SideNav";
import { TopNav } from "./TopNav";

interface AppShellProps {
  children: React.ReactNode;
}

import { usePlanData } from "@/hooks/usePlanData";
import { AlertTriangle } from "lucide-react";

export function AppShell({ children }: AppShellProps) {
  const { data: planData } = usePlanData();

  const showBanner =
    planData?.workspaceId &&
    planData?.planType === "free" &&
    planData?.personalPlanType !== "free";

  const personalPlanName = planData?.personalPlanType
    ? planData.personalPlanType.charAt(0).toUpperCase() + planData.personalPlanType.slice(1)
    : "";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background/95">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl z-30 h-full">
        <SideNav />
      </aside>
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {showBanner && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center justify-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="w-4 h-4" />
            <span>
              You are in a <strong>Free Workspace</strong>. Your personal <strong>{personalPlanName} Plan</strong> does not apply here.
            </span>
          </div>
        )}
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
}
