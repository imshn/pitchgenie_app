"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";

export default function SMTPSettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
    const [testMessage, setTestMessage] = useState("");

    const [formData, setFormData] = useState({
        host: "",
        port: 587,
        username: "",
        password: "",
        fromName: "",
        fromEmail: "",
        encryption: "tls",
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        async function loadSettings() {
            if (!user) return;
            try {
                const docRef = doc(db, "users", user.uid, "smtp", "config");
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setFormData({
                        host: data.host || "",
                        port: data.port || 587,
                        username: data.username || "",
                        password: "", // Don't load encrypted password
                        fromName: data.fromName || "",
                        fromEmail: data.fromEmail || "",
                        encryption: data.encryption || "tls",
                    });
                }
            } catch (error) {
                console.error("Failed to load SMTP settings:", error);
                toast.error("Failed to load settings");
            } finally {
                setLoading(false);
            }
        }
        if (user) {
            loadSettings();
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "port" ? parseInt(value) || 0 : value,
        }));
    };

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({ ...prev, encryption: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/smtp/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save");
            }

            toast.success("SMTP settings saved successfully");
            setTestStatus("idle"); // Reset test status on save
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!user) return;
        setTesting(true);
        setTestStatus("idle");
        setTestMessage("");

        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/smtp/test", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Connection failed");
            }

            setTestStatus("success");
            setTestMessage("Connection successful!");
            toast.success("SMTP connection verified");
        } catch (error: any) {
            setTestStatus("error");
            setTestMessage(error.message);
            toast.error("SMTP connection failed");
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container max-w-2xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">SMTP Settings</h1>
                <p className="text-muted-foreground">
                    Configure your own email server to improve deliverability and branding.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Configuration
                    </CardTitle>
                    <CardDescription>
                        Enter your SMTP credentials. These are stored securely using AES-256 encryption.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="host">SMTP Host</Label>
                                <Input
                                    id="host"
                                    name="host"
                                    placeholder="smtp.gmail.com"
                                    value={formData.host}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="port">Port</Label>
                                <Input
                                    id="port"
                                    name="port"
                                    type="number"
                                    placeholder="587"
                                    value={formData.port}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    name="username"
                                    placeholder="you@company.com"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={!formData.password} // Only required if empty (new setup)
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave blank to keep existing password
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="fromName">From Name</Label>
                                <Input
                                    id="fromName"
                                    name="fromName"
                                    placeholder="John Doe"
                                    value={formData.fromName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fromEmail">From Email</Label>
                                <Input
                                    id="fromEmail"
                                    name="fromEmail"
                                    type="email"
                                    placeholder="john@company.com"
                                    value={formData.fromEmail}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="encryption">Encryption</Label>
                            <Select value={formData.encryption} onValueChange={handleSelectChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select encryption" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tls">TLS (Recommended)</SelectItem>
                                    <SelectItem value="ssl">SSL</SelectItem>
                                    <SelectItem value="none">None</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {testStatus !== "idle" && (
                            <div
                                className={`flex items-center gap-2 rounded-md p-3 text-sm ${testStatus === "success"
                                    ? "bg-green-500/10 text-green-500"
                                    : "bg-red-500/10 text-red-500"
                                    }`}
                            >
                                {testStatus === "success" ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : (
                                    <XCircle className="h-4 w-4" />
                                )}
                                {testMessage}
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTest}
                                disabled={testing || saving}
                            >
                                {testing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Testing...
                                    </>
                                ) : (
                                    "Test Connection"
                                )}
                            </Button>
                            <Button type="submit" disabled={saving || testing}>
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Settings"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
