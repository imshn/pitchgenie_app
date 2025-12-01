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
import { TagInput } from "@/components/onboarding/TagInput"; // TagInput component for services
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
    role: "",
    persona: "",
    company: "",
    website: "",
    companyDescription: "",
    companyLocation: "",
    services: [], // Array to match onboarding
    about: "",
    linkedin: "",
    position: "", // Keep for backward compatibility if needed, or map to role? Onboarding has role. Profile has position. I'll keep both for now but prioritize role.
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

      if (res.data.profile) {
        const data = res.data.profile;
        setProfile({
          ...data,
          // Handle company object if present
          company: typeof data.company === 'object' ? data.company.name || "" : data.company || "",
          // Map nested company fields if they are missing at top level but present in company object
          website: data.website || (data.company?.website) || "",
          companyDescription: data.companyDescription || (data.company?.about) || "",
          companyLocation: data.companyLocation || (data.company?.location) || "", // Assuming location might be there

          // Ensure services is an array
          services: Array.isArray(data.services) ? data.services : (data.services ? data.services.split(',') : []),
          // Map personaTone to persona if needed, or prefer persona
          persona: data.persona || data.personaTone || "",
        });
      }
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
              <div className="max-w-4xl space-y-8">
                {activeTab === "profile" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h3 className="text-lg font-medium text-foreground">Profile Information</h3>
                      <p className="text-sm text-muted-foreground">Update your personal details and online presence.</p>
                    </div>

                    {/* Basic Info Section from Onboarding */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <User className="h-4 w-4" />
                        <span>Basic Information</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            value={profile.fullName}
                            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                            placeholder="Your name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Gender</Label>
                          <Select value={profile.gender} onValueChange={(value) => setProfile({ ...profile, gender: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select value={profile.role} onValueChange={(value) => setProfile({ ...profile, role: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="founder">Founder</SelectItem>
                              <SelectItem value="sdr">SDR</SelectItem>
                              <SelectItem value="consultant">Consultant</SelectItem>
                              <SelectItem value="marketer">Marketer</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Writing Persona</Label>
                          <Select value={profile.persona} onValueChange={(value) => setProfile({ ...profile, persona: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select persona" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="founder-tone">Founder Tone</SelectItem>
                              <SelectItem value="sales-tone">Sales Tone</SelectItem>
                              <SelectItem value="consultant-tone">Consultant Tone</SelectItem>
                              <SelectItem value="friendly-tone">Friendly Tone</SelectItem>
                              <SelectItem value="professional-tone">Professional Tone</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Extras */}
                      <div className="space-y-2 pt-4">
                        <Label>LinkedIn Profile</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            value={profile.linkedin}
                            onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                            placeholder="https://linkedin.com/in/..."
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
                          placeholder="Tell us a bit about yourself..."
                        />
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

                    {/* Company Info Section from Onboarding */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <Building2 className="h-4 w-4" />
                        <span>Company Information</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Company Name</Label>
                          <Input
                            value={profile.company}
                            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                            placeholder="Your company"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Website</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-9"
                              value={profile.website}
                              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <Label>Company Description</Label>
                          <Textarea
                            value={profile.companyDescription}
                            onChange={(e) => setProfile({ ...profile, companyDescription: e.target.value })}
                            placeholder="What does your company do?"
                            rows={3}
                            className="resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            value={profile.companyLocation}
                            onChange={(e) => setProfile({ ...profile, companyLocation: e.target.value })}
                            placeholder="City, Country"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Services Offered</Label>
                          <TagInput
                            value={profile.services || []}
                            onChange={(tags) => setProfile({ ...profile, services: tags })}
                            placeholder="Add a service..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "preferences" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h3 className="text-lg font-medium text-foreground">Preferences</h3>
                      <p className="text-sm text-muted-foreground">Manage your application preferences.</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-muted/20 text-center text-muted-foreground text-sm">
                      More preferences coming soon.
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
