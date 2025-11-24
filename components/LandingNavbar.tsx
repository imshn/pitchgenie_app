"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function LandingNavbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

        {/* Mobile Nav */}
        <div className="flex items-center gap-2 md:hidden">
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="#features" className="text-lg font-medium">
                  Features
                </Link>
                <Link href="#pricing" className="text-lg font-medium">
                  Pricing
                </Link>
                <div className="h-px bg-border my-2" />
                <Link href="/login">
                  <Button variant="ghost" className="w-full justify-start">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
