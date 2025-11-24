/**
 * Invoice List Component
 * 
 * Displays user's invoices with download links
 */

"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

interface Invoice {
    id: string;
    amount: number;
    currency: string;
    issueDate: number;
    period: { start: number; end: number };
    status: string;
    razorpayPaymentId?: string;
    plan: string;
}

export function InvoiceList() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();
            const res = await axios.get("/api/billing/invoices", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setInvoices(res.data.invoices || []);
        } catch (error) {
            console.error("Failed to fetch invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoice = (invoice: Invoice) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text("PitchGenie", 20, 20);
        doc.setFontSize(12);
        doc.text("Invoice", 20, 30);

        // Invoice details
        doc.setFontSize(10);
        doc.text(`Invoice ID: ${invoice.id}`, 20, 45);
        doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 20, 52);
        doc.text(`Status: ${invoice.status}`, 20, 59);

        // Billing period
        doc.text(
            `Period: ${new Date(invoice.period.start).toLocaleDateString()} - ${new Date(
                invoice.period.end
            ).toLocaleDateString()}`,
            20,
            66
        );

        // Amount
        doc.setFontSize(14);
        doc.text(
            `Total: ${invoice.currency} ${(invoice.amount / 100).toFixed(2)}`,
            20,
            80
        );

        // Plan details
        doc.setFontSize(10);
        doc.text(`Plan: ${invoice.plan}`, 20, 95);

        if (invoice.razorpayPaymentId) {
            doc.text(`Payment ID: ${invoice.razorpayPaymentId}`, 20, 102);
        }

        // Footer
        doc.setFontSize(8);
        doc.text("Thank you for your business!", 20, 280);

        // Download
        doc.save(`PitchGenie-Invoice-${invoice.id}.pdf`);
        toast.success("Invoice downloaded");
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    if (invoices.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>Your payment invoices will appear here</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No invoices yet</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Download your payment receipts</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {invoices.map((invoice) => (
                        <div
                            key={invoice.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/20 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">
                                        {invoice.currency} {(invoice.amount / 100).toFixed(2)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(invoice.issueDate).toLocaleDateString()} • {invoice.plan}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadInvoice(invoice)}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
