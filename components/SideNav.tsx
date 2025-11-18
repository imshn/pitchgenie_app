"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, UploadCloud, CreditCard, User, Settings, LogOut } from 'lucide-react';

const items = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Upload CSV", href: "/upload", icon: UploadCloud },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40 glass border-r border-border p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
          PG
        </div>
        <div>
          <h1 className="text-base font-semibold text-foreground">PitchGenie</h1>
          <p className="text-xs text-muted-foreground">AI Outreach</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = path === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-primary/15 text-primary border border-primary/30 shadow-glow"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{it.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border pt-4">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 border border-transparent hover:border-destructive/20"
          onClick={() => {
            import("firebase/auth").then(({ getAuth, signOut }) => {
              const auth = getAuth();
              signOut(auth).then(() => (window.location.href = "/login"));
            });
          }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
