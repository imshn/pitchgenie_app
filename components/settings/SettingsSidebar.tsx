"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    User,
    Building2,
    CreditCard,
    Mail,
    Key,
    Plug,
    Shield,
    LucideIcon,
    ChevronDown
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SettingsSection {
    name: string;
    href: string;
    icon: LucideIcon;
}

const sections: SettingsSection[] = [
    { name: "General", href: "/settings", icon: User },
    { name: "Workspace", href: "/settings/workspace", icon: Building2 },
    { name: "Billing", href: "/settings/billing", icon: CreditCard },
    { name: "Email (SMTP)", href: "/settings/email", icon: Mail },
    { name: "API Keys", href: "/settings/api", icon: Key },
    { name: "Integrations", href: "/settings/integrations", icon: Plug },
    { name: "Security", href: "/settings/security", icon: Shield },
];

export function SettingsSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    // Find current section for mobile dropdown
    const currentSection = sections.find(s => s.href === pathname) || sections[0];
    const CurrentIcon = currentSection.icon;

    return (
        <>
            {/* Desktop Sidebar */}
            <nav className="hidden lg:block space-y-1">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your account and workspace preferences
                    </p>
                </div>

                <div className="space-y-1">
                    {sections.map((section) => {
                        const isActive = pathname === section.href;
                        const Icon = section.icon;

                        return (
                            <button
                                key={section.href}
                                onClick={() => router.push(section.href)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                    "hover:bg-accent",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span>{section.name}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Mobile Dropdown */}
            <div className="lg:hidden mb-6">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <div className="flex items-center gap-2">
                                <CurrentIcon className="h-4 w-4" />
                                <span>{currentSection.name}</span>
                            </div>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <DropdownMenuItem
                                    key={section.href}
                                    onClick={() => router.push(section.href)}
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    <span>{section.name}</span>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    );
}
