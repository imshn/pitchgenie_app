/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { User, Building2, Info, Globe,  } from "lucide-react";

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

  // -----------------------
  // AUTH WATCHER
  // -----------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // -----------------------
  // LOAD PROFILE
  // -----------------------
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

      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error updating profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user)
    return (
      <div className="p-6 text-gray-300 text-lg">
        Please log in to continue.
      </div>
    );

  if (loading)
    return <div className="p-6 text-gray-300 text-lg">Loading profile…</div>;

  // -----------------------
  // UI COMPONENT
  // -----------------------
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-300">

      {/* HEADER */}
      <div className="rounded-3xl p-10 bg-gradient-to-br from-purple-700/10 via-purple-500/5 to-black border border-white/10 shadow-xl">
        <h1 className="text-4xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-gray-400 mt-2 text-lg">
          Improve AI personalization by describing yourself and your business.
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Personal Info */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <User size={20} /> Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            <div>
              <label className="text-sm text-gray-400">Full Name</label>
              <Input
                className="mt-1 bg-black/20 border-white/10"
                value={profile.fullName}
                onChange={(e) =>
                  setProfile({ ...profile, fullName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">Gender (optional)</label>
              <Input
                className="mt-1 bg-black/20 border-white/10"
                value={profile.gender}
                onChange={(e) =>
                  setProfile({ ...profile, gender: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">About You</label>
              <Textarea
                rows={4}
                className="mt-1 bg-black/20 border-white/10"
                value={profile.about}
                onChange={(e) =>
                  setProfile({ ...profile, about: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 size={20} /> Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            <div>
              <label className="text-sm text-gray-400">Company</label>
              <Input
                className="mt-1 bg-black/20 border-white/10"
                value={profile.company}
                onChange={(e) =>
                  setProfile({ ...profile, company: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">Position</label>
              <Input
                className="mt-1 bg-black/20 border-white/10"
                value={profile.position}
                onChange={(e) =>
                  setProfile({ ...profile, position: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">Your Services</label>
              <Textarea
                rows={3}
                className="mt-1 bg-black/20 border-white/10"
                value={profile.services}
                onChange={(e) =>
                  setProfile({ ...profile, services: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Online Presence */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Globe size={20} /> Online Presence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            <div>
              <label className="text-sm text-gray-400">Website</label>
              <Input
                className="mt-1 bg-black/20 border-white/10"
                value={profile.website}
                onChange={(e) =>
                  setProfile({ ...profile, website: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">LinkedIn</label>
              <Input
                className="mt-1 bg-black/20 border-white/10"
                value={profile.linkedin}
                onChange={(e) =>
                  setProfile({ ...profile, linkedin: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">
                Value Proposition (AI inserts this in emails)
              </label>
              <Textarea
                rows={3}
                className="mt-1 bg-black/20 border-white/10"
                value={profile.valueProposition}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    valueProposition: e.target.value,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Tone Settings */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Info size={20} /> Writing Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            <div>
              <label className="text-sm text-gray-400">Default Email Tone</label>
              <select
                className="mt-1 w-full bg-black/20 border border-white/10 rounded-xl p-2 text-white"
                value={profile.personaTone}
                onChange={(e) =>
                  setProfile({ ...profile, personaTone: e.target.value })
                }
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="funny">Funny</option>
                <option value="aggressive">Aggressive</option>
                <option value="short">Short & Punchy</option>
                <option value="long">Detailed</option>
              </select>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* SAVE BUTTON */}
      <div className="pt-4 flex justify-end">
        <Button
          className="px-8 py-3 text-lg rounded-xl"
          onClick={saveProfile}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
