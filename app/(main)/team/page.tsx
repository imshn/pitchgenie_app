"use client";

import { useState } from "react";
import { MemberList } from "@/components/workspace/MemberList";
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeamPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleInviteSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <div className="container mx-auto max-w-5xl py-10 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your workspace members and permissions.
                    </p>
                </div>
                <InviteMemberModal onInviteSuccess={handleInviteSuccess} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>
                        People with access to this workspace.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MemberList refreshTrigger={refreshTrigger} />
                </CardContent>
            </Card>
        </div>
    );
}
