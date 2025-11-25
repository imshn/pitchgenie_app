"use client";

import { SideNav } from "@/components/SideNav";
import { TopNav } from "./TopNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background/95">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl z-30 h-full">
        <SideNav />
      </aside>
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
}
