/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import LeadTable from "@/components/LeadTable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/upload">
            <Button className="rounded-full" variant="secondary">Upload Leads</Button>
          </Link>
          <Button className="rounded-full" id="bulk-generate-btn">
            Generate All
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-white/5 backdrop-blur-xl p-4 sm:p-6 border border-white/10 shadow-sm">
            <LeadTable user={user} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
