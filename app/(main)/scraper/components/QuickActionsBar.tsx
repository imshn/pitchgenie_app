"use client";

import { Button } from "@/components/ui/button";
import { Plus, FileText, Mail, Download, Share2, Send, Sparkles, Loader2, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface QuickActionsBarProps {
    onAddToLeads: () => void;
    onExport: () => void;
    onCopyLink: () => void;
    onGenerateEmail: () => void;
    onPreviewEmail: () => void;
    onSendEmail: () => void;
    generatingEmail: boolean;
    emailGenerated: boolean;
    sendingEmail: boolean;
}

export function QuickActionsBar({
    onAddToLeads,
    onExport,
    onCopyLink,
    onGenerateEmail,
    onPreviewEmail,
    onSendEmail,
    generatingEmail,
    emailGenerated,
    sendingEmail
}: QuickActionsBarProps) {
    const actions = [
        { label: "Add to Leads", icon: Plus, onClick: onAddToLeads, variant: "default" as const, disabled: false, loading: false },
        {
            label: emailGenerated ? "Preview Email" : (generatingEmail ? "Generating..." : "Generate Email"),
            icon: emailGenerated ? Eye : (generatingEmail ? Loader2 : Sparkles),
            onClick: emailGenerated ? onPreviewEmail : onGenerateEmail, // Preview if generated, else generate
            variant: "default" as const,
            disabled: generatingEmail,
            loading: generatingEmail
        },
        {
            label: sendingEmail ? "Sending..." : "Send Email",
            icon: sendingEmail ? Loader2 : Send,
            onClick: onSendEmail,
            variant: "default" as const,
            disabled: !emailGenerated || sendingEmail,
            loading: sendingEmail,
            hidden: !emailGenerated // Only show when email is generated
        },
        { label: "Export Data", icon: Download, onClick: onExport, variant: "outline" as const, disabled: false, loading: false },
        { label: "Copy Link", icon: Share2, onClick: onCopyLink, variant: "ghost" as const, disabled: false, loading: false },
    ].filter(action => !action.hidden);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-card/30 border border-border/50 backdrop-blur-sm mb-6"
        >
            {actions.map((action, idx) => (
                <Button
                    key={idx}
                    variant={action.variant}
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="gap-2 transition-all hover:scale-105 active:scale-95"
                >
                    <action.icon className={action.loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                    {action.label}
                </Button>
            ))}
        </motion.div>
    );
}
