"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface InviteMemberModalProps {
    onInviteSuccess?: () => void;
}

interface SearchResult {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
}

export function InviteMemberModal({ onInviteSuccess }: InviteMemberModalProps) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    // Autocomplete state
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 3) {
                setResults([]);
                return;
            }

            setSearching(true);
            try {
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await res.json();
                setResults(data.users || []);
                setShowResults(true);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Not authenticated");

            const token = await user.getIdToken();

            // Fetch current workspace ID
            const userDocRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userDocRef);
            const userData = userSnap.data();
            const workspaceId = userData?.currentWorkspaceId;

            if (!workspaceId) throw new Error("No workspace selected");

            const res = await fetch("/api/workspaces/invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ email, workspaceId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to invite member");
            }

            toast.success("Invitation sent!");
            setOpen(false);
            setEmail("");
            setQuery("");
            if (onInviteSuccess) onInviteSuccess();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Invite a new member to your workspace. They will receive an email invitation.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="grid gap-4 py-4">
                    <div className="grid gap-2 relative">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="colleague@company.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setQuery(e.target.value); // Sync search with input
                                setShowResults(true);
                            }}
                            required
                            autoComplete="off"
                        />

                        {/* Autocomplete Dropdown */}
                        {showResults && query.length >= 3 && (
                            <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                                {searching ? (
                                    <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Searching...
                                    </div>
                                ) : results.length > 0 ? (
                                    results.map((user) => (
                                        <div
                                            key={user.uid}
                                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                            onClick={() => {
                                                setEmail(user.email);
                                                setQuery(user.email);
                                                setShowResults(false);
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.displayName || "Unknown"}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        No users found. You can still invite by email.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Invitation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
