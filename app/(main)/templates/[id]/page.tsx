/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import axios from "axios";
import { ArrowLeft, Copy, Edit, Trash, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import AuthGuard from "@/components/AuthGuard";
import toast from "react-hot-toast";
import TemplateCreateDialog from "@/components/TemplateCreateDialog";

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showEditDialog, setShowEditDialog] = useState(false);

    useEffect(() => {
        const loadTemplate = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;

                // Use API to get all templates, then find the specific one
                const token = await user.getIdToken();
                const res = await axios.get("/api/getTemplates", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const foundTemplate = res.data.templates?.find((t: any) => t.id === resolvedParams.id);

                if (foundTemplate) {
                    setTemplate(foundTemplate);
                } else {
                    toast.error("Template not found");
                    router.push("/templates");
                }
            } catch (error) {
                console.error("Failed to load template:", error);
                toast.error("Failed to load template");
                router.push("/templates");
            } finally {
                setLoading(false);
            }
        };

        const unsub = auth.onAuthStateChanged((u) => {
            if (u) loadTemplate();
            else {
                setLoading(false);
                router.push("/templates");
            }
        });

        return () => unsub();
    }, [resolvedParams.id, router]);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this template?")) return;

        try {
            const user = auth.currentUser;
            if (!user) return;

            await deleteDoc(doc(db, "users", user.uid, "templates", resolvedParams.id));
            toast.success("Template deleted");
            router.push("/templates");
        } catch (error) {
            console.error("Failed to delete template:", error);
            toast.error("Failed to delete template");
        }
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleCopyAll = () => {
        if (!template) return;
        const fullText = `Subject: ${template.subject}\n\n${template.body}\n\n---\nFollow-up:\n${template.followUp || "N/A"}`;
        navigator.clipboard.writeText(fullText);
        toast.success("Template copied to clipboard");
    };

    const handleEditSuccess = async () => {
        // Reload template data using API
        const user = auth.currentUser;
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const res = await axios.get("/api/getTemplates", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const foundTemplate = res.data.templates?.find((t: any) => t.id === resolvedParams.id);
            if (foundTemplate) {
                setTemplate(foundTemplate);
            }
        } catch (error) {
            console.error("Failed to reload template:", error);
        }

        setShowEditDialog(false);
    };

    if (loading) {
        return (
            <AuthGuard>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AuthGuard>
        );
    }

    if (!template) {
        return null;
    }

    return (
        <AuthGuard>
            <div className="flex flex-col h-full">
                <PageHeader
                    title={template.title || "Untitled Template"}
                    description={`Created ${template.createdAt && new Date(template.createdAt).toLocaleDateString()}`}
                >
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleCopyAll}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy All
                        </Button>
                        <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        <Button variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive">
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </PageHeader>

                <div className="flex-1 p-6 overflow-auto">
                    <div className="max-w-4xl mx-auto">
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/templates")}
                            className="mb-6"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Templates
                        </Button>

                        <div className="space-y-6">
                            {/* Subject */}
                            <section className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Subject Line</h2>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopy(template.subject, "Subject")}
                                    >
                                        <Copy className="w-3 h-3 mr-1.5" />
                                        Copy
                                    </Button>
                                </div>
                                <div className="text-foreground text-base font-medium">
                                    {template.subject}
                                </div>
                            </section>

                            {/* Body */}
                            <section className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Email Body</h2>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopy(template.body, "Body")}
                                    >
                                        <Copy className="w-3 h-3 mr-1.5" />
                                        Copy
                                    </Button>
                                </div>
                                <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                    {template.body}
                                </div>
                            </section>

                            {/* Follow-up */}
                            {template.followUp && (
                                <section className="bg-card border border-border rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Follow-up Message</h2>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCopy(template.followUp, "Follow-up")}
                                        >
                                            <Copy className="w-3 h-3 mr-1.5" />
                                            Copy
                                        </Button>
                                    </div>
                                    <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                        {template.followUp}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>

                <TemplateCreateDialog
                    open={showEditDialog}
                    onClose={() => setShowEditDialog(false)}
                    onSuccess={handleEditSuccess}
                    editTemplate={template}
                />
            </div>
        </AuthGuard>
    );
}
