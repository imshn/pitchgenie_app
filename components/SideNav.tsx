"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Upload, FileText, User, LogOut, Zap, CreditCard, Settings, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { doc, onSnapshot, collection, query, where, documentId, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreditDisplay } from "@/components/credits/CreditDisplay";
import { UpgradePlanModal } from "@/components/credits/UpgradePlanModal";
import { PlanType } from "@/lib/credit-types";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Team", href: "/team", icon: UserPlus },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Billing", href: "/billing", icon: CreditCard },
  // { name: "s", href: "/logout", icon: LogOut },
  { name: "Settings", href: "/settings", icon: Settings }
];

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanType>("free");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>("");

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const unsubDoc = onSnapshot(doc(db, "users", user.uid), async (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentPlan(userData.plan || "free");
            setCurrentWorkspaceId(userData.currentWorkspaceId || "");

            if (userData.workspaces && userData.workspaces.length > 0) {
              try {
                // Fetch workspaces details
                // Note: 'in' query is limited to 10 items usually. 
                // For MVP this is fine, but for scale we might need to fetch individually or use a different structure.
                // Fetch all workspaces where user is a member
                // This is simpler and more robust than fetching by ID list
                const q = query(
                  collection(db, "workspaces"),
                  where("memberIds", "array-contains", user.uid)
                );
                const snap = await getDocs(q);
                setWorkspaces(snap.docs.map(d => ({ id: d.id, ...d.data() })));
              } catch (e) {
                console.error("Failed to fetch workspaces", e);
              }
            } else {
              setWorkspaces([]);
            }
          }
        });
        return () => unsubDoc();
      }
    });
    return () => unsubAuth();
  }, []);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl mr-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
        </div>
      </div>

      <div className="flex-1 overflow-auto py-4 px-4">
        <nav className="grid gap-1">
          <div className="mb-4 px-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            Main Menu
          </div>
          {navItems.map((item) => {
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
        <CreditDisplay onUpgradeClick={() => setShowUpgradeModal(true)} />

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
