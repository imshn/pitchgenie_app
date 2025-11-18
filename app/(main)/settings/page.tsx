/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { User, Building2, Globe, PenTool } from 'lucide-react';
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<any>({
    fullName: "",
    gender: "",
    company: "",
    position: "",
    services: "",
    about: "",
    website: "",
    linkedin: "",
    personaTone: "professional",
    valueProposition: "",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const token = await user.getIdToken();
      const res = await axios.get("/api/profile/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.profile) setProfile(res.data.profile);
      setLoading(false);
    };

    load();
  }, [user]);

  const saveProfile = async () => {
    try {
      setSaving(true);
      const token = await user.getIdToken();

      await axios.post("/api/profile/update", profile, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error updating profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user)
    return (
      <main className="pl-64 min-h-screen bg-background p-8 flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Please log in to continue.</p>
      </main>
    );

  if (loading)
    return (
      <main className="pl-64 min-h-screen bg-background p-8 flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Loading profile…</p>
      </main>
    );

  return (
    <main className="pl-64 min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Profile</h1>
          <p className="text-muted-foreground">Customize your information for better AI personalization</p>
        </div>

        <div className="space-y-6">
          {/* Personal Info */}
          <div className="glass border border-border rounded-lg p-6 shadow-premium">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/15 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Personal Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Full Name</label>
                <input
                  className="w-full px-4 py-2 rounded-lg bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors duration-150 outline-none"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Gender (optional)</label>
                <input
                  className="w-full px-4 py-2 rounded-lg bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors duration-150 outline-none"
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-foreground block mb-2">About You</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors duration-150 outline-none resize-none"
                value={profile.about}
                onChange={(e) => setProfile({ ...profile, about: e.target.value })}
              />
            </div>
          </div>

          {/* Company Info */}
          <div className="glass border border-border rounded-lg p-6 shadow-premium">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/15 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Company Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Company</label>
                <input
                  className="w-full px-4 py-2 rounded-lg bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors duration-150 outline-none"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Position</label>
                <input
                  className="w-full px-4 py-2 rounded-lg bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors duration-150 outline-none"
                  value={profile.position}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-foreground block mb-2">Your Services</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors duration-150 outline-none resize-none"
                value={profile.services}
                onChange={(e) => setProfile({ ...profile, services: e.target.value })}
              />
            </div>
          </div>

          {/* Online Presence */}
          <div className="glass border border-border rounded-lg p-6 shadow-premium">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/15 rounded-lg">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Online Presence</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Website</label>
                <input
                  className="w-full px-4 py-2 rounded-lg bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors duration-150 outline-none"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">LinkedIn</label>
                <input
                  className="w-full px-4 py-2 rounded-lg bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors duration-150 outline-none"
                  value={profile.linkedin}
                  onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-foreground block mb-2">Value Proposition (AI uses this)</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors duration-150 outline-none resize-none"
                value={profile.valueProposition}
                onChange={(e) => setProfile({ ...profile, valueProposition: e.target.value })}
              />
            </div>
          </div>

          {/* Writing Preferences */}
          <div className="glass border border-border rounded-lg p-6 shadow-premium">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/15 rounded-lg">
                <PenTool className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Writing Preferences</h2>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Default Email Tone</label>
              <select
                className="w-full px-4 py-2 rounded-lg bg-secondary/40 border border-border text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors duration-150 outline-none"
                value={profile.personaTone}
                onChange={(e) => setProfile({ ...profile, personaTone: e.target.value })}
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="funny">Funny</option>
                <option value="aggressive">Aggressive</option>
                <option value="short">Short & Punchy</option>
                <option value="long">Detailed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-6 py-3 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 border border-primary/30 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
