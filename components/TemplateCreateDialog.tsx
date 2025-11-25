/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import axios from "axios";
import toast from "react-hot-toast";

interface TemplateCreateDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editTemplate?: any; // If editing existing template
}

export default function TemplateCreateDialog({ open, onClose, onSuccess, editTemplate }: TemplateCreateDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: editTemplate?.title || "",
        subject: editTemplate?.subject || "",
        body: editTemplate?.body || "",
        followUp: editTemplate?.followUp || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setLoading(true);
        try {
            const token = await auth.currentUser.getIdToken();

            await axios.post(
                "/api/saveTemplate",
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(editTemplate ? "Template updated!" : "Template created!");
            onClose();
            if (onSuccess) onSuccess();

            // Reset form
            setFormData({ title: "", subject: "", body: "", followUp: "" });
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.error || "Failed to save template");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Template Name *</Label>
                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="E.g., Cold Outreach V1"
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="subject">Subject Line *</Label>
                        <Input
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="Email subject"
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="body">Email Body *</Label>
                        <Textarea
                            id="body"
                            name="body"
                            value={formData.body}
                            onChange={handleChange}
                            className="min-h-[150px] bg-secondary/40"
                            placeholder="Email body text..."
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="followUp">Follow-up (Optional)</Label>
                        <Textarea
                            id="followUp"
                            name="followUp"
                            value={formData.followUp}
                            onChange={handleChange}
                            className="min-h-[100px] bg-secondary/40"
                            placeholder="Follow-up message..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? "Saving..." : editTemplate ? "Update Template" : "Create Template"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
