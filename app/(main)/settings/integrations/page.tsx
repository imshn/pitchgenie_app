"use client";

import { Plug } from "lucide-react";
import { SettingsSectionCard } from "@/components/settings/SettingsSectionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: string;
    connected: boolean;
    comingSoon?: boolean;
}

const integrations: Integration[] = [
    {
        id: "notion",
        name: "Notion",
        description: "Sync your leads and outreach data to Notion databases",
        icon: "📝",
        connected: false,
        comingSoon: true,
    },
    {
        id: "slack",
        name: "Slack",
        description: "Get notifications and updates in your Slack workspace",
        icon: "💬",
        connected: false,
        comingSoon: true,
    },
    {
        id: "sheets",
        name: "Google Sheets",
        description: "Export and sync data with Google Sheets automatically",
        icon: "📊",
        connected: false,
        comingSoon: true,
    },
    {
        id: "webhooks",
        name: "Webhooks",
        description: "Send custom webhook notifications for events",
        icon: "🔗",
        connected: false,
        comingSoon: true,
    },
    {
        id: "zapier",
        name: "Zapier",
        description: "Connect with 5,000+ apps through Zapier integration",
        icon: "⚡",
        connected: false,
        comingSoon: true,
    },
    {
        id: "hubspot",
        name: "HubSpot",
        description: "Sync contacts and deals with your HubSpot CRM",
        icon: "🎯",
        connected: false,
        comingSoon: true,
    },
];

export default function IntegrationsPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                <p className="text-muted-foreground mt-2">
                    Connect PitchGenie with your favorite tools and services
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {integrations.map((integration) => (
                    <Card key={integration.id} className="p-6 hover:border-primary/50 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <div className="text-4xl">{integration.icon}</div>
                            {integration.comingSoon && (
                                <Badge variant="outline" className="text-xs">
                                    Coming Soon
                                </Badge>
                            )}
                            {integration.connected && (
                                <Badge className="bg-green-500 text-xs">Connected</Badge>
                            )}
                        </div>

                        <h3 className="font-semibold text-lg mb-2">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {integration.description}
                        </p>

                        <Button
                            variant={integration.connected ? "outline" : "default"}
                            className="w-full"
                            disabled={integration.comingSoon}
                        >
                            {integration.connected ? "Disconnect" : "Connect"}
                        </Button>
                    </Card>
                ))}
            </div>

            {/* Custom Integrations */}
            <SettingsSectionCard
                title="Custom Integrations"
                description="Build your own integrations using our API"
                icon={Plug}
            >
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Use our REST API to build custom integrations tailored to your workflow.
                    </p>
                    <Button variant="link" className="pl-0">
                        View API Documentation →
                    </Button>
                </div>
            </SettingsSectionCard>
        </div>
    );
}
