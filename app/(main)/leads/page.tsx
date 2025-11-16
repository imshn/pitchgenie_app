/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LeadTable from "@/components/LeadTable";

export default function LeadsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  if (!user)
    return (
      <div className="p-6 text-gray-300">
        <p>Please log in to view leads.</p>
      </div>
    );

  return (
    <div className="p-6 mx-30">
      <h1 className="text-2xl font-semibold mb-6">Your Leads</h1>
      <LeadTable user={user} />
    </div>
  );
}
