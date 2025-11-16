// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  UploadCloud,
  CreditCard,
  User,
  Settings,
  LogOut,
} from "lucide-react";

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
    <aside className="fixed left-0 top-0 h-screen w-64 dark-glass flex flex-col p-6 gap-6 z-40">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center font-bold">PG</div>
        <div>
          <h1 className="text-lg font-bold">PitchGenie</h1>
          <p className="text-xs text-gray-300">AI Outreach</p>
        </div>
      </div>

      <nav className="flex-1 mt-4 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = path === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                active ? "bg-white/8 text-white" : "text-gray-300 hover:bg-white/6"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{it.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/6 pt-4">
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-300 hover:bg-red-500/10"
          onClick={() => {
            // simple sign out button
            import("firebase/auth").then(({ getAuth, signOut }) => {
              const auth = getAuth();
              signOut(auth).then(() => (window.location.href = "/login"));
            });
          }}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}