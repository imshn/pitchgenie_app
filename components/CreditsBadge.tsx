/* eslint-disable @typescript-eslint/no-explicit-any */
// components/CreditsBadge.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function CreditsBadge() {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return setInfo(null);
      u.getIdToken().then(async (token) => {
        try {
          const res = await axios.get("/api/billing/info", { headers: { Authorization: `Bearer ${token}` } });
          setInfo(res.data);
        } catch (err) {
          console.error(err);
        }
      });
    });
    return () => unsub();
  }, []);

  if (!info) return null;
  return (
    <div className="px-3 py-2 rounded-md bg-white/5 text-sm">
      Credits: <strong>{info.isUnlimited ? "∞" : info.credits}</strong>
      <div className="text-xs text-gray-400">Plan: {info.plan}</div>
    </div>
  );
}
