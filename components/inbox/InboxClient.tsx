"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { groupMessagesIntoThreads, Thread } from "@/utils/threadMessages";
import { MessageDrawer } from "@/app/(main)/inbox/MessageDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Inbox, Send, AlertCircle, RefreshCw, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePlanLimit } from "@/hooks/usePlanLimit";
import { PageHeader } from "@/components/layout/PageHeader";
import AuthGuard from "@/components/AuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function InboxClient() {
    const { user } = useAuth();
    const { plan, isLoading: isPlanLoading } = usePlanLimit();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"inbox" | "sent" | "replies">("inbox");

    useEffect(() => {
        if (isPlanLoading) return;

        if (!user || !plan?.planId) {
            setLoading(false);
            return;
        }

        const workspaceId = plan.id;
        if (!workspaceId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "workspaces", workspaceId, "inbox"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            const grouped = groupMessagesIntoThreads(messages);
            setThreads(grouped);
            setLoading(false);
        }, (error) => {
            console.error("Inbox snapshot error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, plan, isPlanLoading]);

    const filteredThreads = threads.filter(thread => {
        const latestMsg = thread.messages[0];
        if (activeTab === "sent" && latestMsg.folder !== "sent") return false;
        if (activeTab === "inbox" && latestMsg.folder === "sent") return false;
        if (activeTab === "replies" && !latestMsg.sequenceReply) return false;

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            return (
                thread.subject.toLowerCase().includes(lowerQ) ||
                thread.participants.some(p => p.name.toLowerCase().includes(lowerQ) || p.email.toLowerCase().includes(lowerQ))
            );
        }
        return true;
    });

    return (
        <AuthGuard>
            <div className="flex h-full flex-col bg-background">
                <PageHeader title="Inbox" description="Manage your email conversations.">
                    <Button variant="ghost" size="icon" onClick={() => window.location.reload()} className="hover:bg-muted">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </PageHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 border-r bg-muted/5 p-4 flex flex-col gap-2">
                        <Button
                            variant={activeTab === "inbox" ? "secondary" : "ghost"}
                            className={`justify-start h-10 ${activeTab === "inbox" ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground"}`}
                            onClick={() => setActiveTab("inbox")}
                        >
                            <Inbox className="w-4 h-4 mr-2" />
                            Inbox
                        </Button>
                        <Button
                            variant={activeTab === "replies" ? "secondary" : "ghost"}
                            className={`justify-start h-10 ${activeTab === "replies" ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground"}`}
                            onClick={() => setActiveTab("replies")}
                        >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Replies
                        </Button>
                        <Button
                            variant={activeTab === "sent" ? "secondary" : "ghost"}
                            className={`justify-start h-10 ${activeTab === "sent" ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground"}`}
                            onClick={() => setActiveTab("sent")}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Sent
                        </Button>
                    </div>

                    {/* Thread List */}
                    <div className="flex-1 flex flex-col min-w-0 bg-background">
                        <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
                            <div className="relative max-w-2xl">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search emails..."
                                    className="pl-9 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            {loading ? (
                                <div className="p-4 space-y-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-[200px]" />
                                                <Skeleton className="h-4 w-full" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredThreads.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 animate-in fade-in-50">
                                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                                        <Mail className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-1">No messages found</h3>
                                    <p className="text-muted-foreground max-w-sm">
                                        {searchQuery ? "Try adjusting your search terms." : "Your inbox is empty. Start a campaign to get replies!"}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {filteredThreads.map((thread) => {
                                        const latestMsg = thread.messages[0];
                                        const participant = thread.participants.find(p => p.email !== user?.email) || thread.participants[0];
                                        const isUnread = !latestMsg.seen;

                                        return (
                                            <div
                                                key={thread.id}
                                                className={`group p-4 hover:bg-muted/40 cursor-pointer transition-all duration-200 border-l-4 ${isUnread ? "border-l-primary bg-primary/5" : "border-l-transparent"}`}
                                                onClick={() => setSelectedThread(thread)}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <Avatar className="h-10 w-10 border border-border/50">
                                                        <AvatarFallback className={isUnread ? "bg-primary/10 text-primary font-semibold" : "bg-muted text-muted-foreground"}>
                                                            {participant.name?.[0]?.toUpperCase() || participant.email[0]?.toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className={`truncate ${isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                                                                    {participant.name || participant.email}
                                                                </span>
                                                                {thread.messageCount > 1 && (
                                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                                                        {thread.messageCount}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <span className={`text-xs whitespace-nowrap ml-2 ${isUnread ? "text-primary font-medium" : "text-muted-foreground"}`}>
                                                                {formatDistanceToNow(new Date(thread.lastMessageDate.seconds ? thread.lastMessageDate.seconds * 1000 : thread.lastMessageDate), { addSuffix: true })}
                                                            </span>
                                                        </div>

                                                        <div className={`text-sm mb-1 truncate ${isUnread ? "font-medium text-foreground" : "text-foreground/70"}`}>
                                                            {thread.subject}
                                                        </div>

                                                        <div className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                            {thread.snippet || "No preview available"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <MessageDrawer
                    thread={selectedThread}
                    open={!!selectedThread}
                    onClose={() => setSelectedThread(null)}
                    onReplySuccess={() => {
                        // Ideally refresh or update local state, but snapshot handles it
                    }}
                />
            </div>
        </AuthGuard>
    );
}
