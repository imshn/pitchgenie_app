"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, X, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { createDiff } from "@/lib/textDiff";

interface EmailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    emailAddress: string;
    generatedEmail: { email: string; subject: string } | null;
    onSend: (subject: string, body: string) => void;
    sending: boolean;
}

export function EmailModal({ open, onOpenChange, emailAddress, generatedEmail, onSend, sending }: EmailModalProps) {
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [isCheckingDeliverability, setIsCheckingDeliverability] = useState(false);
    const [showDeliverability, setShowDeliverability] = useState(false);
    const [deliverabilityResult, setDeliverabilityResult] = useState<any>(null);

    // Update state when generatedEmail changes
    useEffect(() => {
        if (generatedEmail) {
            setEmail(generatedEmail.email);
            setSubject(generatedEmail.subject);
        } else {
            setEmail("");
            setSubject("");
        }
        // Reset deliverability when new email is loaded
        setShowDeliverability(false);
        setDeliverabilityResult(null);
    }, [generatedEmail]);

    const handleCheckDeliverability = async () => {
        setIsCheckingDeliverability(true);
        setShowDeliverability(false);
        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error("Login required");
                return;
            }
            const token = await user.getIdToken();

            const res = await axios.post(
                "/api/deliverabilityCheck",
                {
                    uid: user.uid,
                    subject,
                    body: email,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setDeliverabilityResult(res.data);
            setShowDeliverability(true);

            // Scroll to results panel after a brief delay
            setTimeout(() => {
                const resultsPanel = document.querySelector('[data-deliverability-results]');
                if (resultsPanel) {
                    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 100);
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.error || "Deliverability check failed");
        } finally {
            setIsCheckingDeliverability(false);
        }
    };

    const applyDeliverabilityImprovements = () => {
        if (!deliverabilityResult) return;
        setSubject(deliverabilityResult.subject || subject);
        setEmail(deliverabilityResult.body || email);
        toast.success("Improvements applied successfully!");
        setShowDeliverability(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Generate & Send Email</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        To: {emailAddress}
                    </p>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject"
                        />
                    </div>

                    <div>
                        <Label htmlFor="email">Email Content</Label>
                        <Textarea
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email content will appear here after generation..."
                            className="min-h-[300px] font-mono text-sm"
                        />
                    </div>

                    {/* Deliverability Check Section */}
                    {showDeliverability && deliverabilityResult && (
                        <div
                            data-deliverability-results
                            className="p-5 bg-secondary/40 border-2 border-primary/30 rounded-lg space-y-5 animate-in fade-in slide-in-from-top-2 duration-300"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-primary" />
                                    Deliverability Analysis Results
                                </h3>
                                <button
                                    onClick={() => setShowDeliverability(false)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Scores Comparison */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-background/50 rounded-lg border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Original Score</div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${(deliverabilityResult.original_score ?? 60) >= 80
                                                    ? 'bg-green-500'
                                                    : (deliverabilityResult.original_score ?? 60) >= 60
                                                        ? 'bg-yellow-500'
                                                        : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${deliverabilityResult.original_score ?? 60}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-foreground">
                                            {deliverabilityResult.original_score ?? 60}/100
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                                    <div className="text-xs text-muted-foreground mb-1">Improved Score</div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all bg-green-500"
                                                style={{ width: `${deliverabilityResult.score}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-primary">
                                            {deliverabilityResult.score}/100
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Issues Found */}
                            {deliverabilityResult.issues_found && deliverabilityResult.issues_found.length > 0 && (
                                <div>
                                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1 font-medium">
                                        <AlertCircle className="w-3 h-3" />
                                        Issues Identified
                                    </div>
                                    <ul className="space-y-1 text-xs text-foreground">
                                        {deliverabilityResult.issues_found.map((issue: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-red-500 mt-0.5">•</span>
                                                <span>{issue}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Spam Words */}
                            {deliverabilityResult.spam_words && deliverabilityResult.spam_words.length > 0 && (
                                <div>
                                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1 font-medium">
                                        <AlertCircle className="w-3 h-3" />
                                        Spam Trigger Words
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {deliverabilityResult.spam_words.map((word: string, i: number) => (
                                            <span
                                                key={i}
                                                className="text-xs px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded"
                                            >
                                                {word}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Changes Made */}
                            {deliverabilityResult.changes_made && deliverabilityResult.changes_made.length > 0 && (
                                <div>
                                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1 font-medium">
                                        <CheckCircle className="w-3 h-3" />
                                        Improvements Applied
                                    </div>
                                    <ul className="space-y-1 text-xs text-foreground">
                                        {deliverabilityResult.changes_made.map((change: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-green-500 mt-0.5">✓</span>
                                                <span>{change}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* GitHub-Style Diff View */}
                            <div>
                                <div className="text-xs text-muted-foreground mb-2 font-medium">Changes Comparison</div>

                                {/* Subject Diff */}
                                <div className="mb-3">
                                    <div className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Subject</div>
                                    <div className="border border-border rounded-lg overflow-hidden bg-background/50">
                                        {createDiff(subject, deliverabilityResult.subject).map((line: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`px-3 py-1 text-xs font-mono flex items-start gap-2 ${line.type === 'remove'
                                                    ? 'bg-red-500/10 text-red-400'
                                                    : line.type === 'add'
                                                        ? 'bg-green-500/10 text-green-400'
                                                        : 'text-muted-foreground'
                                                    }`}
                                            >
                                                <span className="select-none w-4 text-center shrink-0">
                                                    {line.type === 'remove' ? '-' : line.type === 'add' ? '+' : ' '}
                                                </span>
                                                <span className="break-all">{line.text || ' '}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Body Diff */}
                                <div>
                                    <div className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Body</div>
                                    <div className="border border-border rounded-lg overflow-hidden bg-background/50 max-h-48 overflow-y-auto">
                                        {createDiff(email, deliverabilityResult.body).map((line: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`px-3 py-1 text-[11px] font-mono flex items-start gap-2 ${line.type === 'remove'
                                                    ? 'bg-red-500/10 text-red-400'
                                                    : line.type === 'add'
                                                        ? 'bg-green-500/10 text-green-400'
                                                        : 'text-muted-foreground'
                                                    }`}
                                            >
                                                <span className="select-none w-4 text-center shrink-0 mt-0.5">
                                                    {line.type === 'remove' ? '-' : line.type === 'add' ? '+' : ' '}
                                                </span>
                                                <span className="break-words whitespace-pre-wrap flex-1">{line.text || ' '}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        setShowDeliverability(false);
                                        toast.success("Improvements dismissed");
                                    }}
                                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150"
                                >
                                    Deny Improvements
                                </button>
                                <button
                                    onClick={applyDeliverabilityImprovements}
                                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 border border-primary/30 transition-colors duration-150 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Apply Changes
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        onClick={handleCheckDeliverability}
                        disabled={!email || isCheckingDeliverability}
                        variant="outline"
                    >
                        {isCheckingDeliverability ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <Shield className="h-4 w-4 mr-2" />
                                Check Deliverability
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={() => onSend(subject, email)}
                        disabled={!email || sending}
                    >
                        {sending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Sending...
                            </>
                        ) : (
                            "Send Email"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
