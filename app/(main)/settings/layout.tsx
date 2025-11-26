"use client";

import { ReactNode } from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";

interface SettingsLayoutProps {
    children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
                {/* Mobile Dropdown - Shown everywhere on mobile */}
                <div className="lg:hidden">
                    <SettingsSidebar />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
                    {/* Desktop Sidebar - Hidden on mobile */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-8">
                            <SettingsSidebar />
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="min-w-0">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
