/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Watch Firebase auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Load analytics once user exists
  useEffect(() => {
    const load = async () => {
      if (!user) return; // wait for auth

      try {
        const token = await user.getIdToken();

        const s = await axios.get("/api/analytics/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const e = await axios.get("/api/analytics/recent", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setSummary(s.data);
        setEvents(e.data.events);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }

      setLoading(false);
    };

    load();
  }, [user]);

  // If still no user → not logged in
  if (!user)
    return (
      <div className="p-6 text-gray-300">
        <p>You must log in to view dashboard.</p>
      </div>
    );

  if (loading)
    return (
      <div className="p-6 text-gray-300">
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="p-6 mx-30">
      <h1 className="text-2xl font-semibold mb-6">Dashboard Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card label="Emails Sent" value={summary.sent} />
        <Card label="Opens" value={summary.opens} />
        <Card label="Clicks" value={summary.clicks} />
        <Card label="Replies" value={summary.replies} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card
          label="Avg Deliverability Score"
          value={`${summary.deliverability}/100`}
        />
      </div>

      <h2 className="text-xl font-semibold mb-4 mt-8">Recent Activity</h2>

      <div className="bg-black/20 border border-white/10 rounded-lg p-4">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="flex justify-between py-2 border-b border-white/5 text-sm"
          >
            <span className="text-gray-300 capitalize">{ev.type}</span>
            <span className="text-gray-500">
              {new Date(ev.timestamp).toLocaleString()}
            </span>
          </div>
        ))}

        {events.length === 0 && (
          <p className="text-center text-gray-400 py-4">No activity yet.</p>
        )}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: any }) {
  return (
    <div className=" bg-white/5 border border-white/10 rounded-xl p-4 text-center">
      <h3 className="text-gray-400 text-sm">{label}</h3>
      <p className="text-2xl text-purple-300 font-bold mt-2">{value}</p>
    </div>
  );
}
