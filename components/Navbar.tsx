"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Rocket, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link className="flex items-center gap-2 font-bold text-xl" href="/">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-glow">
            <Rocket className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            PitchGenie
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                Sign Up
              </Button>
            </Link>
          </div>
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
