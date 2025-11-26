"use client";

import { useState } from "react";
import { Key, Copy, Trash2, Plus } from "lucide-react";
import { SettingsSectionCard } from "@/components/settings/SettingsSectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";

interface ApiKey {
    id: string;
    label: string;
    key: string;
    createdAt: number;
}

export default function APIKeysPage() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([
        {
            id: "1",
            label: "Production API",
            key: "pk_live_1234567890abcdef",
            createdAt: Date.now() - 86400000,
        },
    ]);
    const [newKeyLabel, setNewKeyLabel] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);

    const handleCreateKey = () => {
        if (!newKeyLabel.trim()) {
            toast.error("Please enter a key label");
            return;
        }

        const newKey: ApiKey = {
            id: Date.now().toString(),
            label: newKeyLabel,
            key: `pk_live_${Math.random().toString(36).substring(2, 15)}`,
            createdAt: Date.now(),
        };

        setApiKeys([...apiKeys, newKey]);
        setNewKeyLabel("");
        setShowCreateForm(false);
        toast.success("API key created successfully!");
    };

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        toast.success("API key copied to clipboard!");
    };

    const handleRevokeKey = (id: string) => {
        setApiKeys(apiKeys.filter((k) => k.id !== id));
        toast.success("API key revoked");
    };

    const maskKey = (key: string) => {
        return `${key.substring(0, 12)}${"•".repeat(20)}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your API keys for programmatic access
                    </p>
                </div>
                <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create API Key
                </Button>
            </div>

            {/* Plan Restriction Notice */}
            <Card className="p-4 border-yellow-500/50 bg-yellow-500/10">
                <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-sm text-yellow-600">Pro Plan Feature</p>
                        <p className="text-xs text-yellow-600/80 mt-1">
                            API access is available on Pro and Agency plans. Upgrade to create and use API keys.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Create Key Form */}
            {showCreateForm && (
                <SettingsSectionCard
                    title="Create New API Key"
                    description="Generate a new API key for your workspace"
                >
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="keyLabel">Key Label</Label>
                            <Input
                                id="keyLabel"
                                value={newKeyLabel}
                                onChange={(e) => setNewKeyLabel(e.target.value)}
                                placeholder="e.g., Production, Development, Testing"
                                className="mt-2"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={handleCreateKey}>Create Key</Button>
                            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </SettingsSectionCard>
            )}

            {/* API Keys List */}
            <SettingsSectionCard
                title="Active API Keys"
                description="View and manage your existing API keys"
                icon={Key}
            >
                <div className="space-y-3">
                    {apiKeys.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No API keys created yet
                        </p>
                    ) : (
                        apiKeys.map((apiKey) => (
                            <Card key={apiKey.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <p className="font-medium">{apiKey.label}</p>
                                            <Badge variant="outline" className="text-xs">
                                                Active
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-mono text-muted-foreground">
                                            {maskKey(apiKey.key)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Created {new Date(apiKey.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCopyKey(apiKey.key)}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRevokeKey(apiKey.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </SettingsSectionCard>

            {/* API Documentation */}
            <SettingsSectionCard
                title="API Documentation"
                description="Learn how to use the PitchGenie API"
            >
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        View our comprehensive API documentation to integrate PitchGenie into your workflow.
                    </p>
                    <Button variant="link" className="pl-0">
                        View API Docs →
                    </Button>
                </div>
            </SettingsSectionCard>
        </div>
    );
}
