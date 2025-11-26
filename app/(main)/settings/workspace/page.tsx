"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Building2, Zap, Users } from "lucide-react";
import { SettingsSectionCard } from "@/components/settings/SettingsSectionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { usePlanData } from "@/hooks/usePlanData";

export default function WorkspaceSettingsPage() {
    const { user } = useAuth();
    const { data: planData, loading: planLoading } = usePlanData();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [workspaceName, setWorkspaceName] = useState("");
    const [workspaceId, setWorkspaceId] = useState("");

    useEffect(() => {
        if (!user) return;

        const fetchWorkspace = async () => {
            try {
                // We can get workspaceId from planData if available, or fetch from user
                // But fetching from user is safer for initial load if planData is slow
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const userData = userDoc.data();
                const currentWorkspaceId = userData?.currentWorkspaceId;

                if (!currentWorkspaceId) {
                    toast.error("No workspace found");
                    setLoading(false);
                    return;
                }

                setWorkspaceId(currentWorkspaceId);

                // Only fetch workspace name, don't rely on credits/plan here
                const workspaceDoc = await getDoc(doc(db, "workspaces", currentWorkspaceId));
                const workspaceData = workspaceDoc.data();

                if (workspaceData) {
                    setWorkspaceName(workspaceData.workspaceName || "My Workspace");
                }

                setLoading(false);
            } catch (error) {
                console.error("Error fetching workspace:", error);
                toast.error("Failed to load workspace details");
                setLoading(false);
            }
        };

        fetchWorkspace();
    }, [user]);

    const handleSave = async () => {
        if (!workspaceId) return;
        if (!workspaceName.trim()) {
            toast.error("Workspace name cannot be empty");
            return;
        }

        setSaving(true);
        try {
            await updateDoc(doc(db, "workspaces", workspaceId), {
                workspaceName: workspaceName.trim(),
                updatedAt: Date.now(),
            });

            toast.success("Workspace name updated!");
            window.location.reload();
        } catch (error) {
            console.error("Error updating workspace:", error);
            toast.error("Failed to update workspace name");
        } finally {
            setSaving(false);
        }
    };

    if (loading || planLoading || !planData) {
        return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;
    }

    const { planData: planInfo, usage, remaining } = planData;
    const creditPercent = planInfo.creditLimit > 0 ? (usage.creditsUsed / planInfo.creditLimit) * 100 : 0;

    // Handle Timestamp conversion for resetDate
    let resetDate = "N/A";
    if (usage.resetDate) {
        try {
            // Try to convert to date
            const dateValue: any = usage.resetDate;
            if (dateValue.toDate && typeof dateValue.toDate === 'function') {
                resetDate = dateValue.toDate().toLocaleDateString();
            } else if (typeof dateValue === 'number') {
                resetDate = new Date(dateValue).toLocaleDateString();
            } else {
                resetDate = new Date(dateValue).toLocaleDateString();
            }
        } catch (error) {
            console.error('Error parsing resetDate:', error);
            resetDate = "Invalid Date";
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your workspace name and view plan information
                </p>
            </div>

            {/* Workspace Name */}
            <SettingsSectionCard
                title="Workspace Name"
                description="Update your workspace display name"
                icon={Building2}
            >
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="workspaceName">Name</Label>
                        <Input
                            id="workspaceName"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            placeholder="Enter workspace name"
                            className="mt-2"
                        />
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </SettingsSectionCard>

            {/* Current Plan */}
            <SettingsSectionCard
                title="Current Plan"
                description="Your active subscription plan and limits"
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-lg">{planInfo.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {planInfo.priceMonthly > 0 ? `₹${planInfo.priceMonthly}/mo` : "Free Plan"}
                            </p>
                        </div>
                        {planInfo.badge && (
                            <Badge className="bg-primary">{planInfo.badge}</Badge>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                            <p className="text-sm text-muted-foreground">Member Limit</p>
                            <p className="text-lg font-semibold flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {planInfo.memberLimit} members
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Scraper Access</p>
                            <p className="text-lg font-semibold">
                                {planInfo.scraperLightLimit} light, {planInfo.scraperDeepLimit} deep
                            </p>
                        </div>
                    </div>
                </div>
            </SettingsSectionCard>

            {/* Credit Summary */}
            <SettingsSectionCard
                title="Credit Usage"
                description="Track your monthly credit consumption"
                icon={Zap}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{usage.creditsUsed}</span>
                        <span className="text-sm text-muted-foreground">
                            used of {planInfo.creditLimit} credits
                        </span>
                    </div>
                    <Progress value={creditPercent} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Resets on</span>
                        <span className="font-medium">{resetDate}</span>
                    </div>
                </div>
            </SettingsSectionCard>
        </div>
    );
}
