"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { auth } from "@/lib/firebase";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function WorkspaceSwitcher({
    workspaces,
    currentWorkspaceId,
}: {
    workspaces: any[];
    currentWorkspaceId: string;
}) {
    const router = useRouter();
    const [activeWorkspace, setActiveWorkspace] = React.useState<any>(
        workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0]
    );

    // Update active workspace when props change
    React.useEffect(() => {
        if (workspaces.length > 0) {
            setActiveWorkspace(workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0]);
        }
    }, [workspaces, currentWorkspaceId]);

    const handleSwitch = async (workspace: any) => {
        if (workspace.id === activeWorkspace?.id) return;

        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch("/api/workspaces/switch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ workspaceId: workspace.id }),
            });

            if (!res.ok) throw new Error("Failed to switch workspace");

            setActiveWorkspace(workspace);
            toast.success(`Switched to ${workspace.name}`);
            router.refresh();
            // Force reload to ensure all data is fresh
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Failed to switch workspace");
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="lg"
                    className="w-full justify-between px-2 hover:bg-secondary/50"
                >
                    <div className="flex items-center gap-2 text-left">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <span className="text-lg font-bold">
                                {activeWorkspace?.name?.charAt(0) || "W"}
                            </span>
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">
                                {activeWorkspace?.name || "Select Workspace"}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                                {activeWorkspace?.plan || "Free"}
                            </span>
                        </div>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
            >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Workspaces
                </DropdownMenuLabel>
                {workspaces.map((workspace) => (
                    <DropdownMenuItem
                        key={workspace.id}
                        onClick={() => handleSwitch(workspace)}
                        className="gap-2 p-2"
                    >
                        <div className="flex size-6 items-center justify-center rounded-sm border">
                            {workspace.name?.charAt(0)}
                        </div>
                        {workspace.name}
                        {workspace.id === activeWorkspace?.id && (
                            <Check className="ml-auto h-4 w-4" />
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 p-2" disabled>
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                        <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">Add workspace (Coming Soon)</div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
