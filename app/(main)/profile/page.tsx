/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { User, Building2, Globe, PenTool, Save, CreditCard, Bell, Shield } from 'lucide-react';
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AuthGuard from "@/components/AuthGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { BillingContent } from "@/components/billing/BillingContent";

type SettingsNavItem = {
  id: string;
  label: string;
  icon: any;
  disabled?: boolean;
};

const settingsNav: SettingsNavItem[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "company", label: "Company", icon: Building2 },
  { id: "preferences", label: "Preferences", icon: PenTool },
  // { id: "billing", label: "Billing", icon: CreditCard, disabled: false },
  // { id: "notifications", label: "Notifications", icon: Bell, disabled: true },
];

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

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

  if (!user || loading) return null;

  return (
    <AuthGuard>
      <div className="flex flex-col h-full">
        <PageHeader
          title="Settings"
          description="Manage your account settings and preferences."
        >
          <Button onClick={saveProfile} disabled={saving}>
            {saving ? "Saving..." : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </PageHeader>

        <div className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col lg:flex-row">
            {/* Settings Sidebar */}
            <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-border bg-card/30 overflow-y-auto">
              <nav className="p-4 space-y-1">
                {settingsNav.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => !item?.disabled && setActiveTab(item.id)}
                    disabled={item?.disabled}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      activeTab === item.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                      item?.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10">
              <div className="max-w-6xl space-y-8">
                {activeTab === "profile" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h3 className="text-lg font-medium text-foreground">Profile Information</h3>
                      <p className="text-sm text-muted-foreground">Update your personal details and online presence.</p>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            value={profile.fullName}
                            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Gender</Label>
                          <Input
                            value={profile.gender}
                            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>About You</Label>
                        <Textarea
                          rows={4}
                          value={profile.about}
                          onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                          className="resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Website</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-9"
                              value={profile.website}
                              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>LinkedIn</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-9"
                              value={profile.linkedin}
                              onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "company" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h3 className="text-lg font-medium text-foreground">Company Details</h3>
                      <p className="text-sm text-muted-foreground">Tell us about your business and role.</p>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Company Name</Label>
                          <Input
                            value={profile.company}
                            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Position</Label>
                          <Input
                            value={profile.position}
                            onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Services / Products</Label>
                        <Textarea
                          rows={3}
                          value={profile.services}
                          onChange={(e) => setProfile({ ...profile, services: e.target.value })}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Value Proposition</Label>
                        <Textarea
                          rows={3}
                          value={profile.valueProposition}
                          onChange={(e) => setProfile({ ...profile, valueProposition: e.target.value })}
                          className="resize-none"
                          placeholder="What makes your offer unique?"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "preferences" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h3 className="text-lg font-medium text-foreground">AI Preferences</h3>
                      <p className="text-sm text-muted-foreground">Customize how the AI generates content for you.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Default Email Tone</Label>
                        <Select
                          value={profile.personaTone}
                          onValueChange={(val) => setProfile({ ...profile, personaTone: val })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a tone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="funny">Funny</SelectItem>
                            <SelectItem value="aggressive">Aggressive</SelectItem>
                            <SelectItem value="short">Short & Punchy</SelectItem>
                            <SelectItem value="long">Detailed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}


              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
