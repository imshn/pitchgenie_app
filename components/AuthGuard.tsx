// components/AuthGuard.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  return <>{children}</>;
}