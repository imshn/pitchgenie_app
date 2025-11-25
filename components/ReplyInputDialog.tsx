/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ReplyInputDialogProps {
    open: boolean;
    onClose: () => void;
    onAnalyze: (replyText: string) => Promise<void>;
    isLoading?: boolean;
}

export default function ReplyInputDialog({ open, onClose, onAnalyze, isLoading }: ReplyInputDialogProps) {
    const [replyText, setReplyText] = useState("");

    const handleSubmit = async () => {
        if (!replyText.trim()) return;
        await onAnalyze(replyText);
        setReplyText(""); // Reset after analysis
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Analyze Lead Reply</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <label htmlFor="reply" className="text-sm font-medium text-foreground mb-2 block">
                            Paste the reply you received from the lead
                        </label>
                        <Textarea
                            id="reply"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Paste the email reply here..."
                            className="min-h-[150px] bg-secondary/40"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !replyText.trim()}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Analyzing..." : "Analyze Reply"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
