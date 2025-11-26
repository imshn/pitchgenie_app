"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface SettingsSectionCardProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    children: ReactNode;
    className?: string;
}

export function SettingsSectionCard({
    title,
    description,
    icon: Icon,
    children,
    className,
}: SettingsSectionCardProps) {
    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-primary" />}
                    <CardTitle>{title}</CardTitle>
                </div>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
        </Card>
    );
}
