"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import {
  LayoutDashboard,
  Upload,
  CreditCard,
  LogOut,
  Menu,
  X,
  FileText,
  UserPlus,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const user = auth.currentUser;
  const [credits, setCredits] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false); // State for mobile sidebar

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const data = snap.data();
      setCredits(data?.credits ?? 0);
    });

    return () => unsub();
  }, [user]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: "Leads",
      href: "/leads",
      icon: <UserPlus size={18} />,
    },
    {
      name: "Templates",
      href: "/templates",
      icon: <FileText size={18} />,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings size={18} />,
    },
    {
      name: "Upload CSV",
      href: "/upload",
      icon: <Upload size={18} />,
    },
    {
      name: "Pricing",
      href: "/pricing",
      icon: <CreditCard size={18} />,
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-60 border-r border-white/10 bg-[#0b0b0f]/70 backdrop-blur-xl shadow-[0_0_25px_rgba(255,255,255,0.05)] p-6 flex flex-col z-50
        lg:translate-x-0 transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <h1 className="text-2xl font-bold mb-10 tracking-tight">PitchGenie</h1>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);

            return (
              <Link
                href={item.href}
                key={item.name}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${
                  active
                    ? "bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }
              `}
                onClick={() => setIsOpen(false)} // Close sidebar on link click
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Credits */}
        <div className="mt-6 mb-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300">
          Credits: <span className="font-semibold text-white">{credits}</span>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full rounded-xl bg-white/5 border-white/10 text-gray-300 hover:text-white"
          onClick={() => {
            auth.signOut();
            window.location.href = "/login";
          }}
        >
          <LogOut size={16} className="mr-2" /> Logout
        </Button>
      </aside>
    </>
  );
}
