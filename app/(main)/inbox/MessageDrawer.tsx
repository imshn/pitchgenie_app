"use client";

import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Reply, Send, Loader2, X, Paperclip, MoreVertical } from "lucide-react";
import { Thread, ThreadMessage } from "@/utils/threadMessages";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import toast from "react-hot-toast";

interface MessageDrawerProps {
    thread: Thread | null;
    open: boolean;
    onClose: () => void;
    onReplySuccess?: () => void;
}

export function MessageDrawer({ thread, open, onClose, onReplySuccess }: MessageDrawerProps) {
    const { user } = useAuth();
    const [replying, setReplying] = useState(false);
    const [replyBody, setReplyBody] = useState("");
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && scrollRef.current) {
            // Scroll to bottom when opened
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }, [open, thread]);

    if (!thread) return null;

    const latestMessage = thread.messages[0]; // Newest first
    const participants = thread.participants.filter(p => p.email !== user?.email); // Exclude self if possible, but user email might not match exactly
    const recipient = participants[0] || { name: "Unknown", email: "" };

    const handleSendReply = async () => {
        if (!replyBody.trim()) return;
        setSending(true);

        try {
            const token = await user?.getIdToken();
            await axios.post("/api/inbox/sendReply", {
                to: recipient.email,
                subject: `Re: ${thread.subject.replace(/^Re:\s*/i, "")}`,
                body: replyBody.replace(/\n/g, "<br>"), // Simple formatting
                threadId: thread.id,
                originalMessageId: latestMessage.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Reply sent");
            setReplyBody("");
            setReplying(false);
            if (onReplySuccess) onReplySuccess();
        } catch (error) {
            console.error("Failed to send reply:", error);
            toast.error("Failed to send reply");
        } finally {
            setSending(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
            <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col h-full bg-background border-l">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-card/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                            <X className="w-4 h-4" />
                        </Button>
                        <div className="flex flex-col overflow-hidden">
                            <h2 className="font-semibold truncate">{thread.subject}</h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="truncate">{recipient.name || recipient.email}</span>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                <span className="shrink-0">{thread.messageCount} messages</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages List */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6 pb-4">
                        {/* Render messages oldest to newest for reading flow */}
                        {[...thread.messages].reverse().map((msg, i) => (
                            <MessageItem key={msg.id} message={msg} isLast={i === thread.messages.length - 1} />
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Reply Box */}
                <div className="p-4 border-t bg-card/50 backdrop-blur-sm">
                    {replying ? (
                        <div className="space-y-3 animate-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                                <span>Replying to <span className="font-medium text-foreground">{recipient.name || recipient.email}</span></span>
                                <Button variant="ghost" size="sm" onClick={() => setReplying(false)} className="h-auto p-0 hover:bg-transparent">
                                    Cancel
                                </Button>
                            </div>
                            <Textarea
                                value={replyBody}
                                onChange={(e) => setReplyBody(e.target.value)}
                                placeholder="Type your reply..."
                                className="min-h-[120px] resize-none bg-background focus-visible:ring-1"
                                autoFocus
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        <Paperclip className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Button onClick={handleSendReply} disabled={sending || !replyBody.trim()}>
                                    {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                    Send Reply
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            className="w-full justify-start text-muted-foreground h-12 bg-muted/50 hover:bg-muted"
                            variant="outline"
                            onClick={() => setReplying(true)}
                        >
                            <Reply className="w-4 h-4 mr-2" />
                            Reply to {recipient.name || "thread"}...
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function MessageItem({ message, isLast }: { message: ThreadMessage; isLast: boolean }) {
    // Simple HTML strip for preview if bodyHtml is complex, but we want to render HTML safely
    // For MVP, we'll use a sanitized div or just text. 
    // Ideally use DOMPurify. For now, we'll assume internal content is somewhat safe or just render text.
    // Let's render text for safety in this MVP step, or simple HTML.

    return (
        <div className={`flex gap-4 ${message.folder === 'sent' ? 'flex-row-reverse' : ''}`}>
            <Avatar className="w-8 h-8 border">
                <AvatarFallback>{message.from.name?.[0] || message.from.email[0]}</AvatarFallback>
            </Avatar>
            <div className={`flex flex-col max-w-[85%] ${message.folder === 'sent' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm">{message.from.name || message.from.email}</span>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.date.seconds ? message.date.seconds * 1000 : message.date), { addSuffix: true })}
                    </span>
                </div>
                <div
                    className={`rounded-lg p-4 text-sm whitespace-pre-wrap shadow-sm border ${message.folder === 'sent'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border'
                        }`}
                >
                    {message.bodyText || "No content"}
                </div>
            </div>
        </div>
    );
}
