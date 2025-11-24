"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { User, Building2, Globe, PenTool, Loader2 } from 'lucide-react';
import toast from "react-hot-toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

      try {
        const token = await user.getIdToken();
        const res = await axios.get("/api/profile/get", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.profile) setProfile(res.data.profile);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-12 h-12 text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <p className="text-lg">Please sign in to view settings.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="Settings" 
        description="Customize your profile and AI preferences."
      >
        <Button onClick={saveProfile} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle>Personal Details</CardTitle>
              </div>
              <CardDescription>Your basic information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender (optional)</Label>
                  <Input
                    id="gender"
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="about">About You</Label>
                <Textarea
                  id="about"
                  rows={3}
                  value={profile.about}
                  onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <CardTitle>Company Details</CardTitle>
              </div>
              <CardDescription>Tell us about your organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={profile.position}
                    onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="services">Your Services</Label>
                <Textarea
                  id="services"
                  rows={3}
                  value={profile.services}
                  onChange={(e) => setProfile({ ...profile, services: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Online Presence */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <CardTitle>Online Presence</CardTitle>
              </div>
              <CardDescription>Where can we find you online?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={profile.linkedin}
                    onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valueProposition">Value Proposition (AI uses this)</Label>
                <Textarea
                  id="valueProposition"
                  rows={3}
                  value={profile.valueProposition}
                  onChange={(e) => setProfile({ ...profile, valueProposition: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Writing Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-primary" />
                <CardTitle>Writing Preferences</CardTitle>
              </div>
              <CardDescription>Customize how the AI writes for you.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="personaTone">Default Email Tone</Label>
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
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
