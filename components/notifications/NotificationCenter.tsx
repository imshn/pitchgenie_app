"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Notification {
    id: string;
    type: "workspace_invite";
    workspaceId: string;
    workspaceName: string;
    senderEmail: string;
    createdAt: number;
    read: boolean;
}

export function NotificationCenter() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "notifications"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Notification[];

            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAccept = async (notification: Notification) => {
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/workspaces/accept", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ workspaceId: notification.workspaceId }),
            });

            if (!res.ok) throw new Error("Failed to accept invite");

            toast.success(`Joined ${notification.workspaceName}`);

            // Delete notification after accepting
            await deleteDoc(doc(db, "users", user!.uid, "notifications", notification.id));

            // Refresh page to show new workspace
            window.location.reload();

        } catch (error) {
            console.error(error);
            toast.error("Failed to join workspace");
        }
    };

    const handleDecline = async (notification: Notification) => {
        if (!confirm("Are you sure you want to decline this invitation?")) return;
        try {
            await deleteDoc(doc(db, "users", user!.uid, "notifications", notification.id));
            toast.success("Invitation declined");
        } catch (error) {
            console.error(error);
        }
    };

    const markAsRead = async () => {
        if (unreadCount === 0) return;

        // Mark all as read
        // In a real app, we might want to batch this or only mark visible ones
        // For now, let's just leave them as is visually but reset count? 
        // Or actually update them in DB.
        // Let's just update the unread count locally for now or update DB if we want persistence.
        // Updating DB for each doc might be too many writes.
        // Let's just keep it simple: clicking opens the menu, actions delete the notif.
    };

    return (
        <DropdownMenu onOpenChange={(open) => {
            if (open) markAsRead();
        }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No new notifications
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-2 p-3 focus:bg-muted/50">
                            <div className="flex w-full justify-between gap-2">
                                <span className="font-medium text-sm">
                                    {notification.type === "workspace_invite" ? "Workspace Invitation" : "Notification"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(notification.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                <strong>{notification.senderEmail}</strong> invited you to join <strong>{notification.workspaceName}</strong>
                            </p>
                            <div className="flex w-full justify-end gap-2 mt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDecline(notification);
                                    }}
                                >
                                    <X className="mr-1 h-3 w-3" /> Decline
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAccept(notification);
                                    }}
                                >
                                    <Check className="mr-1 h-3 w-3" /> Accept
                                </Button>
                            </div>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
