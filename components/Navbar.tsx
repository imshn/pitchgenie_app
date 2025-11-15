"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Navbar() {
  const [credits, setCredits] = useState<number | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const data = snap.data();
      setCredits(data?.credits ?? 0);
    });

    return () => unsub();
  }, [user]);

  return (
    <header className="w-full border-b border-white/10 sticky top-0 z-50 bg-[#0B0B0F]/70 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        {/* LEFT — LOGO */}
        <Link href="/dashboard" className="text-xl font-bold">
          PitchGenie
        </Link>

        {/* MIDDLE — NAV LINKS */}
        <nav className="flex items-center gap-6 text-sm text-gray-300">
          <Link
            href="/dashboard"
            className="hover:text-white/90 text-gray-300 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/upload"
            className="hover:text-white/90 text-gray-300 transition-colors"
          >
            Upload CSV
          </Link>
          <Link
            href="/pricing"
            className="hover:text-white/90 text-gray-300 transition-colors"
          >
            Pricing
          </Link>
        </nav>

        {/* RIGHT — CREDITS + LOGOUT */}
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm">
            {credits} credits
          </span>

          <Button
            variant="outline"
            className="rounded-full bg-white/10 hover:bg-white/20 border border-white/10"
            onClick={() => {
              auth.signOut();
              window.location.href = "/login";
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
