"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Download, Loader2, FileText } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface Invoice {
    id: string;
    amount: number;
    currency: string;
    status: string;
    date: number;
    pdfUrl?: string;
    short_url?: string;
}

export function InvoiceListModal() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [error, setError] = useState("");

    const fetchInvoices = async () => {
        if (!user) return;
        setLoading(true);
        setError("");
        try {
            const token = await user.getIdToken();
            const res = await axios.get("/api/billing/invoices", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInvoices(res.data.invoices || []);
        } catch (err) {
            console.error("Error fetching invoices:", err);
            setError("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (val) fetchInvoices();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    View Invoices
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Billing History</DialogTitle>
                    <DialogDescription>
                        View and download your past invoices
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">{error}</div>
                    ) : invoices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No invoices found
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {invoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {new Date(invoice.date * 1000).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {invoice.currency} {(invoice.amount / 100).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                                            {invoice.status}
                                        </Badge>
                                        {invoice.short_url && (
                                            <Button variant="ghost" size="icon" asChild>
                                                <a href={invoice.short_url} target="_blank" rel="noopener noreferrer">
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
