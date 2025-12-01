"use client";

import { useState, useEffect } from "react";
import { Shield, Lock, Smartphone, LogOut, Laptop, Loader2, Mail } from "lucide-react";
import { SettingsSectionCard } from "@/components/settings/SettingsSectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import axios from "axios";
import { UAParser } from "ua-parser-js";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

interface ActiveSession {
    id: string;
    device: string;
    browser: string;
    location: string;
    lastActive: string;
    current: boolean;
}

export default function SecurityPage() {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [revoking, setRevoking] = useState(false);

    // 2FA State
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showMfaDialog, setShowMfaDialog] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [mfaStep, setMfaStep] = useState<"send" | "verify">("send");
    const [mfaLoading, setMfaLoading] = useState(false);

    // Active Sessions State
    const [sessions, setSessions] = useState<any[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        // 1. Record current session & get ID
        const recordSession = async () => {
            try {
                const token = await user.getIdToken();
                const res = await axios.post("/api/auth/session", {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCurrentSessionId(res.data.sessionId);
            } catch (err) {
                console.error("Failed to record session", err);
            }
        };
        recordSession();

        // 2. Listen to sessions
        const q = query(
            collection(db, "users", user.uid, "sessions"),
            orderBy("lastActive", "desc")
        );

        const unsub = onSnapshot(q, (snapshot: any) => {
            const sessionsData = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));
            setSessions(sessionsData);
        });

        return () => unsub();
    }, [user]);

    const handleChangePassword = async () => {
        if (!user || !user.email) return;
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            // 1. Re-authenticate the user
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // 2. Update password
            await updatePassword(user, newPassword);

            toast.success("Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Password change error:", error);
            if (error.code === 'auth/wrong-password') {
                toast.error("Incorrect current password");
            } else if (error.code === 'auth/requires-recent-login') {
                toast.error("Please log out and log in again to change password");
            } else {
                toast.error(error.message || "Failed to change password");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogoutAllDevices = async () => {
        if (!confirm("Are you sure you want to log out of all devices? You will be logged out immediately.")) return;

        setRevoking(true);
        try {
            const token = await user?.getIdToken();
            await axios.post(
                "/api/auth/revoke-tokens",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Logged out from all devices");
        } catch (error) {
            console.error("Logout all error:", error);
            toast.error("Failed to revoke sessions");
        } finally {
            setRevoking(false);
        }
    };

    const handleToggle2FA = async (checked: boolean) => {
        if (checked) {
            setShowMfaDialog(true);
            setMfaStep("send");
        } else {
            // Disable 2FA
            if (!confirm("Are you sure you want to disable Two-Factor Authentication?")) return;
            try {
                const token = await user?.getIdToken();
                await axios.post("/api/auth/2fa/disable", {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTwoFactorEnabled(false);
                toast.success("2FA has been disabled");
            } catch (error) {
                console.error("Disable 2FA error:", error);
                toast.error("Failed to disable 2FA");
            }
        }
    };

    const sendVerificationEmail = async () => {
        setMfaLoading(true);
        try {
            const token = await user?.getIdToken();
            await axios.post("/api/auth/2fa/send", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMfaStep("verify");
            toast.success("Verification code sent to your email!");
        } catch (error: any) {
            console.error("Send code error:", error);
            toast.error(error.response?.data?.error || "Failed to send code. Check SMTP settings.");
        } finally {
            setMfaLoading(false);
        }
    };

    const verifyAndEnable = async () => {
        if (!verificationCode) {
            toast.error("Please enter the code");
            return;
        }

        setMfaLoading(true);
        try {
            const token = await user?.getIdToken();
            await axios.post("/api/auth/2fa/verify", { code: verificationCode }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTwoFactorEnabled(true);
            setShowMfaDialog(false);
            toast.success("Two-Factor Authentication enabled successfully!");
        } catch (error: any) {
            console.error("Enroll error:", error);
            toast.error(error.response?.data?.error || "Invalid code");
        } finally {
            setMfaLoading(false);
        }
    };

    const currentSession = sessions.find(session => session.id === currentSessionId);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account security and active sessions
                </p>
            </div>

            {/* Password Management */}
            <SettingsSectionCard
                title="Change Password"
                description="Update your account password"
                icon={Lock}
            >
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="mt-2"
                        />
                    </div>

                    <Button onClick={handleChangePassword} disabled={loading}>
                        {loading ? "Updating..." : "Change Password"}
                    </Button>
                </div>
            </SettingsSectionCard>

            {/* Two-Factor Authentication */}
            <SettingsSectionCard
                title="Two-Factor Authentication"
                description="Add an extra layer of security to your account via Email"
                icon={Smartphone}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                            Enable 2FA to receive a verification code via email when logging in.
                        </p>
                        {twoFactorEnabled && <Badge className="mt-2 bg-green-500">Enabled</Badge>}
                    </div>
                    <Switch
                        checked={twoFactorEnabled}
                        onCheckedChange={handleToggle2FA}
                    />
                </div>
            </SettingsSectionCard>

            {/* Active Sessions */}
            <SettingsSectionCard
                title="Active Sessions"
                description={`Manage devices logged into your account (${sessions.length} active)`}
                icon={Shield}
            >
                <div className="space-y-3">
                    {sessions.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Loading sessions...
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <Card
                                key={session.id}
                                className={`p-4 border-primary/20 ${session.id === currentSessionId ? 'bg-primary/5' : 'bg-card'}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-background rounded-full">
                                            {session.deviceType === 'Mobile' ? (
                                                <Smartphone className="w-5 h-5 text-primary" />
                                            ) : (
                                                <Laptop className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-sm">
                                                    {session.os} • {session.browser}
                                                </p>
                                                {session.id === currentSessionId && (
                                                    <Badge variant="default" className="text-[10px] h-5">Current</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {session.location} • {new Date(session.lastActive).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}

                    <div className="pt-2">
                        <p className="text-sm text-muted-foreground mb-4">
                            If you see any suspicious activity, you can log out of all other devices.
                        </p>
                        <Button
                            variant="destructive"
                            onClick={handleLogoutAllDevices}
                            disabled={revoking}
                            className="w-full sm:w-auto"
                        >
                            {revoking ? "Logging out..." : "Log Out from All Devices"}
                        </Button>
                    </div>
                </div>
            </SettingsSectionCard>

            {/* MFA Enrollment Dialog */}
            <Dialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Setup Email Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                            {mfaStep === "send"
                                ? "We will send a verification code to your registered email address."
                                : `Enter the code sent to ${user?.email}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {mfaStep === "send" ? (
                            <div className="flex justify-center py-4">
                                <Mail className="h-16 w-16 text-primary/20" />
                            </div>
                        ) : (
                            <div className="flex justify-center py-2">
                                <InputOTP
                                    maxLength={6}
                                    value={verificationCode}
                                    onChange={(value) => setVerificationCode(value)}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        {mfaStep === "send" ? (
                            <Button onClick={sendVerificationEmail} disabled={mfaLoading} className="w-full">
                                {mfaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Verification Email
                            </Button>
                        ) : (
                            <Button onClick={verifyAndEnable} disabled={mfaLoading} className="w-full">
                                {mfaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify & Enable
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
