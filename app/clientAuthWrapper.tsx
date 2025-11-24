/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
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
      <div className="w-full h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}