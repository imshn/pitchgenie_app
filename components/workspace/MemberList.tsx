"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Trash2, Mail, LogOut } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppDialog, useAppDialog } from "@/components/ui/app-dialog";

// Temporary interface until we have shared types
interface Member {
    uid: string;
    email: string;
    role: "owner" | "admin" | "member";
    joinedAt?: number;
}

interface Invite {
    email: string;
    invitedAt?: string | null;
}

export function MemberList({ refreshTrigger }: { refreshTrigger: number }) {
    const [members, setMembers] = useState<Member[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<string | null>(null);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
    const { user, loading: authLoading } = useAuth();
    const { dialogConfig, setDialogConfig, showPrompt, showSuccess, showError } = useAppDialog();
    const router = useRouter();

    const fetchMembers = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();

            // 1. Get current workspace ID
            const userDocRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userDocRef);

            if (!userSnap.exists()) throw new Error("User profile not found");

            const userData = userSnap.data();
            let workspaceId = userData.currentWorkspaceId;

            // 2. Ensure workspace exists
            if (!workspaceId) {
                // Check if user has any workspaces
                if (userData.workspaces && userData.workspaces.length > 0) {
                    workspaceId = userData.workspaces[0];
                    // Update current workspace
                    await fetch("/api/workspaces/switch", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ workspaceId })
                    });
                } else {
                    // Create default workspace
                    const createRes = await fetch("/api/workspaces/create", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ name: "My Workspace" })
                    });
                    const createData = await createRes.json();
                    if (!createRes.ok) throw new Error(createData.error || "Failed to create default workspace");
                    workspaceId = createData.workspaceId;
                }
            }

            if (!workspaceId) throw new Error("Failed to resolve workspace");

            setCurrentWorkspaceId(workspaceId);

            // 3. Fetch members
            const res = await fetch(`/api/workspaces/members?workspaceId=${workspaceId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch members");

            setMembers(data.members || []);
            setInvites(data.invited || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load members");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            fetchMembers();
        } else if (!authLoading && !user) {
            setLoading(false); // Stop loading if not authenticated (should be handled by AuthGuard but safe to add)
        }
    }, [refreshTrigger, user, authLoading]);

    const handleRemove = async (memberUid: string) => {
        showPrompt(
            "Remove Member",
            "Are you sure you want to remove this member from the workspace?",
            async () => {
                setRemoving(memberUid);
                try {
                    const token = await user?.getIdToken();
                    const res = await fetch("/api/workspaces/remove", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ workspaceId: currentWorkspaceId, memberUid })
                    });

                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || "Failed to remove member");
                    }

                    showSuccess("Member Removed", "The member has been successfully removed from the workspace.");
                    fetchMembers();
                } catch (error: any) {
                    console.error(error);
                    showError("Error", error.message || "Failed to remove member");
                } finally {
                    setRemoving(null);
                }
            },
            undefined,
            "Remove",
            "Cancel"
        );
    };

    const handleCancelInvite = async (email: string) => {
        showPrompt(
            "Cancel Invitation",
            `Are you sure you want to cancel the invitation for ${email}?`,
            async () => {
                try {
                    const token = await user?.getIdToken();
                    const res = await fetch("/api/workspaces/cancel-invite", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ workspaceId: currentWorkspaceId, email })
                    });

                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || "Failed to cancel invitation");
                    }

                    showSuccess("Invitation Cancelled", "The invitation has been successfully cancelled.");
                    fetchMembers();
                } catch (error: any) {
                    console.error(error);
                    showError("Error", error.message || "Failed to cancel invitation");
                }
            },
            undefined,
            "Cancel Invite",
            "Keep Invite"
        );
    };

    const handleLeaveWorkspace = async () => {
        showPrompt(
            "Leave Workspace",
            "Are you sure you want to leave this workspace? You'll need to be invited again to rejoin.",
            async () => {
                try {
                    const token = await user?.getIdToken();
                    const res = await fetch("/api/workspaces/leave", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ workspaceId: currentWorkspaceId })
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        throw new Error(data.error || "Failed to leave workspace");
                    }

                    showSuccess(
                        "Left Workspace",
                        "You have successfully left the workspace.",
                        () => {
                            router.push("/dashboard");
                            window.location.reload();
                        }
                    );
                } catch (error: any) {
                    console.error(error);
                    showError("Error", error.message || "Failed to leave workspace");
                }
            },
            undefined,
            "Leave Workspace",
            "Stay"
        );
    };

    const currentUserMember = members.find(m => m.uid === user?.uid);
    const isOwner = currentUserMember?.role === "owner";

    return (
        <div className="space-y-6">
            {!isOwner && (
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/50 hover:bg-destructive/10"
                        onClick={handleLeaveWorkspace}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Workspace
                    </Button>
                </div>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {members.map((member) => (
                                    <TableRow key={member.uid}>
                                        <TableCell className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-medium">
                                                {member.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{member.email}</span>
                                                {member.uid === user?.uid && (
                                                    <span className="text-xs text-muted-foreground">(You)</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                                                {member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {(() => {
                                                if (!member.joinedAt) return "-";
                                                const date = new Date(member.joinedAt);
                                                return isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {member.role !== "owner" && member.uid !== user?.uid && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRemove(member.uid)}
                                                    disabled={removing === member.uid}
                                                >
                                                    {removing === member.uid ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {invites.map((invite) => (
                                    <TableRow key={invite.email}>
                                        <TableCell className="flex items-center gap-3 opacity-70">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{invite.email}</span>
                                                <span className="text-xs text-muted-foreground">Invitation Pending</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">Invited</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {invite.invitedAt ? new Date(invite.invitedAt).toLocaleDateString() : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => handleCancelInvite(invite.email)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AppDialog
                {...dialogConfig}
                onOpenChange={(open) => setDialogConfig({ ...dialogConfig, open })}
            />
        </div>
    );
}
