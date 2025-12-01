"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { Mail, CheckCircle, XCircle, AlertCircle, Server, Shield, AtSign, Inbox, HelpCircle, Loader2 } from "lucide-react";
import { SettingsSectionCard } from "@/components/settings/SettingsSectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlanLimit } from "@/hooks/usePlanLimit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UpgradePlanModal } from "@/components/credits/UpgradePlanModal";
import { PlanType } from "@/lib/credit-types";

type Provider = "gmail" | "outlook" | "yahoo" | "zoho" | "icloud" | "custom";

const PROVIDERS: { [key in Provider]: { name: string; smtpHost: string; smtpPort: string; imapHost: string; imapPort: string; encryption: "ssl" | "tls" } } = {
    gmail: { name: "Gmail / Google Workspace", smtpHost: "smtp.gmail.com", smtpPort: "587", imapHost: "imap.gmail.com", imapPort: "993", encryption: "tls" },
    outlook: { name: "Outlook / Office 365", smtpHost: "smtp.office365.com", smtpPort: "587", imapHost: "outlook.office365.com", imapPort: "993", encryption: "tls" },
    yahoo: { name: "Yahoo Mail", smtpHost: "smtp.mail.yahoo.com", smtpPort: "465", imapHost: "imap.mail.yahoo.com", imapPort: "993", encryption: "ssl" },
    zoho: { name: "Zoho Mail", smtpHost: "smtp.zoho.com", smtpPort: "465", imapHost: "imap.zoho.com", imapPort: "993", encryption: "ssl" },
    icloud: { name: "iCloud Mail", smtpHost: "smtp.mail.me.com", smtpPort: "587", imapHost: "imap.mail.me.com", imapPort: "993", encryption: "tls" },
    custom: { name: "Custom Domain / Other", smtpHost: "", smtpPort: "587", imapHost: "", imapPort: "993", encryption: "tls" },
};

export default function EmailSettingsPage() {
    const { user } = useAuth();
    const { plan } = usePlanLimit();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [testingImap, setTestingImap] = useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [provider, setProvider] = useState<Provider>("custom");

    const [config, setConfig] = useState({
        host: "",
        port: "",
        username: "",
        password: "",
        fromName: "",
        fromEmail: "",
        encryption: "tls",
        imapHost: "",
        imapPort: "",
        imapUsername: "",
        imapPassword: "",
        imapEncryption: "tls",
    });

    const [smtpStatus, setSmtpStatus] = useState<"connected" | "failed" | "idle">("idle");
    const [imapStatus, setImapStatus] = useState<"connected" | "failed" | "idle">("idle");
    const [smtpError, setSmtpError] = useState("");
    const [imapError, setImapError] = useState("");

    // Plan Enforcement
    const isImapAllowed = plan?.planType ? plan.planType !== "free" : false;

    useEffect(() => {
        if (!user) return;

        const fetchConfig = async () => {
            try {
                const token = await user.getIdToken();
                const res = await axios.get("/api/smtp/get", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data.smtpConfig) {
                    setConfig(res.data.smtpConfig);
                    // Try to guess provider
                    const host = res.data.smtpConfig.host;
                    if (host.includes("gmail")) setProvider("gmail");
                    else if (host.includes("office365") || host.includes("outlook")) setProvider("outlook");
                    else if (host.includes("yahoo")) setProvider("yahoo");
                    else if (host.includes("zoho")) setProvider("zoho");
                    else if (host.includes("icloud")) setProvider("icloud");
                    else setProvider("custom");

                    if (res.data.smtpConfig.host) setSmtpStatus("connected"); // Assume connected if config exists
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching config:", error);
                setLoading(false);
            }
        };

        fetchConfig();
    }, [user]);

    const handleProviderChange = (value: Provider) => {
        setProvider(value);
        if (value !== "custom") {
            const defaults = PROVIDERS[value];
            setConfig(prev => ({
                ...prev,
                host: defaults.smtpHost,
                port: defaults.smtpPort,
                encryption: defaults.encryption,
                imapHost: defaults.imapHost,
                imapPort: defaults.imapPort,
                imapEncryption: "ssl", // Most IMAP is SSL 993
            }));
        }
    };

    const handleEmailChange = (email: string) => {
        setConfig(prev => ({ ...prev, username: email, fromEmail: email, imapUsername: email }));

        // Auto-detect provider if still custom
        if (provider === "custom" && email.includes("@")) {
            const domain = email.split("@")[1];
            if (domain === "gmail.com") handleProviderChange("gmail");
            else if (domain === "outlook.com" || domain === "hotmail.com") handleProviderChange("outlook");
            else if (domain === "yahoo.com") handleProviderChange("yahoo");
            else if (domain === "zoho.com") handleProviderChange("zoho");
            else if (domain === "icloud.com") handleProviderChange("icloud");
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await user?.getIdToken();
            await axios.post(
                "/api/smtp/configure",
                { smtpConfig: config },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Settings saved successfully!");
            setSmtpStatus("connected"); // Optimistic
        } catch (error) {
            console.error("Error saving config:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const testSmtp = async () => {
        setTestingSmtp(true);
        setSmtpError("");
        try {
            const token = await user?.getIdToken();
            await axios.post("/api/smtp/test", {
                host: config.host,
                port: config.port,
                user: config.username,
                password: config.password
            }, { headers: { Authorization: `Bearer ${token}` } });
            setSmtpStatus("connected");
            toast.success("SMTP Connection Successful");
        } catch (error: any) {
            setSmtpStatus("failed");
            setSmtpError(error.response?.data?.error || "Connection failed");
            toast.error("SMTP Connection Failed");
        } finally {
            setTestingSmtp(false);
        }
    };

    const testImap = async () => {
        setTestingImap(true);
        setImapError("");
        try {
            const token = await user?.getIdToken();
            await axios.post("/api/imap/test", {
                host: config.imapHost,
                port: config.imapPort,
                user: config.imapUsername,
                password: config.imapPassword
            }, { headers: { Authorization: `Bearer ${token}` } });
            setImapStatus("connected");
            toast.success("IMAP Connection Successful");
        } catch (error: any) {
            setImapStatus("failed");
            setImapError(error.response?.data?.error || "Connection failed");
            toast.error("IMAP Connection Failed");
        } finally {
            setTestingImap(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Email Configuration</h1>
                    <p className="text-muted-foreground mt-2">
                        Connect your email provider to send campaigns and sync replies.
                    </p>
                </div>
                <div className="flex gap-2">
                    <SetupGuideModal />
                </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_350px] gap-8">
                <div className="space-y-8">
                    {/* Provider Selection */}
                    <Card className="border-muted bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Email Provider</CardTitle>
                            <CardDescription>Select your email service provider to auto-fill settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select value={provider} onValueChange={(v: Provider) => handleProviderChange(v)}>
                                <SelectTrigger className="h-12 text-base">
                                    <SelectValue placeholder="Select Provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PROVIDERS).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>{value.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* SMTP Settings */}
                    <SettingsSectionCard title="Sending Settings (SMTP)" description="Configure how PitchGenie sends emails on your behalf." icon={Mail}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>SMTP Host</Label>
                                    <Input value={config.host} onChange={e => setConfig({ ...config, host: e.target.value })} placeholder="smtp.example.com" className="mt-1.5" />
                                    <p className="text-[10px] text-muted-foreground mt-1">Usually smtp.gmail.com or smtp.office365.com</p>
                                </div>
                                <div>
                                    <Label>Port</Label>
                                    <Input value={config.port} onChange={e => setConfig({ ...config, port: e.target.value })} placeholder="587" className="mt-1.5" />
                                    <p className="text-[10px] text-muted-foreground mt-1">587 (TLS) or 465 (SSL)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Username</Label>
                                    <Input value={config.username} onChange={e => handleEmailChange(e.target.value)} placeholder="you@company.com" className="mt-1.5" />
                                    <p className="text-[10px] text-muted-foreground mt-1">Your full email address</p>
                                </div>
                                <div>
                                    <Label>Password</Label>
                                    <Input type="password" value={config.password} onChange={e => setConfig({ ...config, password: e.target.value, imapPassword: e.target.value })} placeholder="••••••••" className="mt-1.5" />
                                    <p className="text-[10px] text-muted-foreground mt-1">Use App Password for Gmail/Outlook</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>From Name</Label>
                                    <Input value={config.fromName} onChange={e => setConfig({ ...config, fromName: e.target.value })} placeholder="Your Name" className="mt-1.5" />
                                </div>
                                <div>
                                    <Label>From Email</Label>
                                    <Input value={config.fromEmail} onChange={e => setConfig({ ...config, fromEmail: e.target.value })} placeholder="you@company.com" className="mt-1.5" />
                                </div>
                            </div>
                        </div>
                    </SettingsSectionCard>

                    {/* IMAP Settings */}
                    <div className="relative">
                        {!isImapAllowed && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6 border rounded-lg">
                                <Shield className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">Inbox Sync is a Premium Feature</h3>
                                <p className="text-muted-foreground max-w-sm mb-4">Upgrade to Starter or Pro to sync replies and manage your inbox directly.</p>
                                <Button onClick={() => setUpgradeModalOpen(true)}>Upgrade Plan</Button>
                            </div>
                        )}
                        <UpgradePlanModal
                            open={upgradeModalOpen}
                            onClose={() => setUpgradeModalOpen(false)}
                            currentPlan={(plan?.planType as PlanType) || "free"}
                        />
                        <SettingsSectionCard title="Receiving Settings (IMAP)" description="Configure how PitchGenie reads replies." icon={Inbox}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>IMAP Host</Label>
                                        <Input value={config.imapHost} onChange={e => setConfig({ ...config, imapHost: e.target.value })} placeholder="imap.example.com" className="mt-1.5" disabled={!isImapAllowed} />
                                    </div>
                                    <div>
                                        <Label>Port</Label>
                                        <Input value={config.imapPort} onChange={e => setConfig({ ...config, imapPort: e.target.value })} placeholder="993" className="mt-1.5" disabled={!isImapAllowed} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Username</Label>
                                        <Input value={config.imapUsername} onChange={e => setConfig({ ...config, imapUsername: e.target.value })} placeholder="you@company.com" className="mt-1.5" disabled={!isImapAllowed} />
                                    </div>
                                    <div>
                                        <Label>Password</Label>
                                        <Input type="password" value={config.imapPassword} onChange={e => setConfig({ ...config, imapPassword: e.target.value })} placeholder="••••••••" className="mt-1.5" disabled={!isImapAllowed} />
                                    </div>
                                </div>
                            </div>
                        </SettingsSectionCard>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button size="lg" onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Configuration
                        </Button>
                    </div>
                </div>

                {/* Sidebar: Status & Tests */}
                <div className="space-y-6">
                    <Card className="border-muted bg-card/50 backdrop-blur-sm sticky top-6">
                        <CardHeader>
                            <CardTitle>Connection Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* SMTP Status */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${smtpStatus === 'connected' ? 'bg-green-500' : smtpStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                        <span className="font-medium">SMTP (Sending)</span>
                                    </div>
                                    {smtpStatus === 'connected' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    {smtpStatus === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                                </div>
                                {smtpError && <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{smtpError}</p>}
                                <Button variant="outline" size="sm" className="w-full" onClick={testSmtp} disabled={testingSmtp}>
                                    {testingSmtp ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : "Test SMTP"}
                                </Button>
                            </div>

                            <div className="h-px bg-border" />

                            {/* IMAP Status */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${imapStatus === 'connected' ? 'bg-green-500' : imapStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                        <span className="font-medium">IMAP (Receiving)</span>
                                    </div>
                                    {imapStatus === 'connected' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    {imapStatus === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                                </div>
                                {imapError && <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{imapError}</p>}
                                <Button variant="outline" size="sm" className="w-full" onClick={testImap} disabled={testingImap || !isImapAllowed}>
                                    {testingImap ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : "Test IMAP"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function SendIcon(props: any) {
    return <Mail {...props} />
}

function SetupGuideModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Setup Guide
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Email Setup Guide</DialogTitle>
                    <DialogDescription>Follow these steps to connect your email provider.</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="gmail">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="gmail">Gmail</TabsTrigger>
                        <TabsTrigger value="outlook">Outlook</TabsTrigger>
                        <TabsTrigger value="zoho">Zoho</TabsTrigger>
                        <TabsTrigger value="other">Other</TabsTrigger>
                    </TabsList>
                    <TabsContent value="gmail" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">1. Enable 2-Step Verification</h3>
                            <p className="text-sm text-muted-foreground">Go to your Google Account Security settings and enable 2-Step Verification if not already enabled.</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold">2. Create an App Password</h3>
                            <p className="text-sm text-muted-foreground">Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-primary hover:underline">App Passwords</a>. Select "Mail" and "Other (Custom name)" as PitchGenie. Copy the 16-character password.</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold">3. Use App Password</h3>
                            <p className="text-sm text-muted-foreground">Paste the 16-character password into the SMTP and IMAP password fields in PitchGenie. Do NOT use your regular Gmail password.</p>
                        </div>
                    </TabsContent>
                    <TabsContent value="outlook" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">1. Enable 2FA</h3>
                            <p className="text-sm text-muted-foreground">Ensure Two-Factor Authentication is enabled on your Microsoft account.</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold">2. Create App Password</h3>
                            <p className="text-sm text-muted-foreground">Go to Security settings → Advanced security options → App passwords. Create a new password.</p>
                        </div>
                    </TabsContent>
                    <TabsContent value="zoho" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">1. Enable IMAP Access</h3>
                            <p className="text-sm text-muted-foreground">Log in to Zoho Mail → Settings → Mail Accounts → IMAP Access → Enable IMAP Access.</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold">2. Generate App Password</h3>
                            <p className="text-sm text-muted-foreground">Go to My Account → Security → App Passwords. Generate a new password for PitchGenie.</p>
                        </div>
                    </TabsContent>
                    <TabsContent value="other" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">General Instructions</h3>
                            <p className="text-sm text-muted-foreground">For other providers (cPanel, Hostinger, GoDaddy, etc.), find your "Email Configuration" or "Connect Devices" settings in your hosting dashboard.</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                                <li>SMTP Port is usually 587 (TLS) or 465 (SSL)</li>
                                <li>IMAP Port is usually 993 (SSL)</li>
                                <li>Username is your full email address</li>
                            </ul>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
