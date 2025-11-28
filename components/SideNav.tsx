"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Upload, FileText, User, LogOut, Zap, CreditCard, Settings, UserPlus, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditDisplay } from "@/components/credits/CreditDisplay";
import { UpgradePlanModal } from "@/components/credits/UpgradePlanModal";
import { PlanType } from "@/lib/credit-types";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { usePlanData } from "@/hooks/usePlanData";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Inbox", href: "/inbox", icon: Inbox },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Team", href: "/team", icon: UserPlus },
  // { name: "Profile", href: "/profile", icon: User },
  // { name: "Billing", href: "/billing", icon: CreditCard },
  // { name: "s", href: "/logout", icon: LogOut },
  // { name: "Settings", href: "/settings", icon: Settings }
];

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { workspaces, currentWorkspaceId } = useWorkspace();
  const { data: planData, loading: planLoading } = usePlanData();

  const currentPlan = (planData?.planType as PlanType) || "free";

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex h-16 items-center border-b border-border px-4">
        {/* <Link href="/" className="flex items-center gap-2 font-bold text-xl mr-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
        </Link> */}
        <div className="flex-1 min-w-0">
          <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
        </div>
      </div>

      <div className="flex-1 overflow-auto py-4 px-4">
        <nav className="grid gap-1">
          <div className="mb-4 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            Main Menu
          </div>
          {navItems.filter(item => {
            if (item.name === "Inbox" && currentPlan === "free") return false;
            return true;
          }).map((item) => {
            const isActive = pathname === item.href;

            // Add data-tour attributes for tour targets
            const tourAttr = item.name === "Leads" ? "pipeline" : undefined;

            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour={tourAttr}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-border space-y-3">
        {/* New Credit Display using planData */}
        {planLoading ? (
          <div className="h-12 animate-pulse bg-muted rounded-md" />
        ) : (
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-medium text-muted-foreground truncate max-w-[110px]"
                title={planData?.workspaceId ? "Limits apply to this workspace" : "Your personal plan"}
              >
                {planData?.planData.name || "Free"} {planData?.workspaceId ? "(Workspace)" : "Plan"}
              </span>
              <span className="text-xs font-bold">
                {planData?.remaining.credits ?? 0} / {planData?.planData.creditLimit ?? 50}
              </span>
            </div>
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${Math.min(100, ((planData?.usage.creditsUsed || 0) / (planData?.planData.creditLimit || 1)) * 100)}%`
                }}
              />
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            auth.signOut();
            router.push("/login");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>

      <UpgradePlanModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={currentPlan}
      />
    </div>
  );
}
