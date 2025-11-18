/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import Sidebar from "@/components/SideNav";
import { usePathname } from "next/navigation";

export default function ClientAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any | null>(null);
  const [checking, setChecking] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  // ❌ PAGES WHERE SIDEBAR MUST NOT SHOW
  const hideSidebarRoutes = ["/", "/login", "/signup"];
  const shouldShowSidebar = user && !hideSidebarRoutes.includes(pathname);

  return (
    <div className="flex">
      {/* Sidebar only when logged in & not on landing/login pages */}
      {shouldShowSidebar && <Sidebar />}

      {/* Main content */}
      <main className="flex-1 p-0">
        {children}
      </main>
    </div>
  );
}