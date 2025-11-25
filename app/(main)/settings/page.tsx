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
        // description="Customize your profile and AI preferences."
      >
        <Button onClick={saveProfile} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          
          {/* SMTP Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <CardTitle>SMTP Configuration</CardTitle>
              </div>
              <CardDescription>Configure your email provider for sending campaigns.</CardDescription>
            </CardHeader>
            <CardContent>
              <SMTPSettings />
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

function SMTPSettings() {
  const [smtp, setSmtp] = useState({
    host: "",
    port: 587,
    username: "",
    password: "",
    fromName: "",
    fromEmail: "",
    encryption: "tls",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const fetchSmtp = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await axios.get("/api/smtp/get", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.smtp) {
          setSmtp({ ...res.data.smtp, password: "" }); // Don't show password
          setConfigured(true);
        }
      } catch (error) {
        console.error("Failed to fetch SMTP", error);
      } finally {
        setLoading(false);
      }
    };

    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) fetchSmtp();
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      await axios.post("/api/smtp/save", smtp, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("SMTP settings saved successfully!");
      setConfigured(true);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      // If password is empty (masked), we can't test with current state unless we save first or backend handles it.
      // But for security, usually we require re-entry or backend uses stored password if empty.
      // The test endpoint currently decrypts stored password. So we should save first or just call test.
      // Actually, the test endpoint uses stored settings. So we should save first if changed.

      // Let's assume user saves first. Or we can warn.
      // For now, let's just call test endpoint which uses stored config.

      await axios.post("/api/smtp/test", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Connection successful!");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.error || "Connection failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <div className="space-y-4">
      {configured && (
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          SMTP Configured
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Host</Label>
          <Input
            value={smtp.host}
            onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
            placeholder="smtp.gmail.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Port</Label>
          <Input
            type="number"
            value={smtp.port}
            onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value) })}
            placeholder="587"
          />
        </div>
        <div className="space-y-2">
          <Label>Username</Label>
          <Input
            value={smtp.username}
            onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
            placeholder="email@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input
            type="password"
            value={smtp.password}
            onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
            placeholder={configured ? "••••••••" : "Enter password"}
          />
        </div>
        <div className="space-y-2">
          <Label>From Name</Label>
          <Input
            value={smtp.fromName}
            onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label>From Email</Label>
          <Input
            value={smtp.fromEmail}
            onChange={(e) => setSmtp({ ...smtp, fromEmail: e.target.value })}
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Encryption</Label>
          <Select
            value={smtp.encryption}
            onValueChange={(val) => setSmtp({ ...smtp, encryption: val })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tls">TLS</SelectItem>
              <SelectItem value="ssl">SSL</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Configuration
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={testing || !configured}>
          {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Test Connection
        </Button>
      </div>
    </div>
  );
}
