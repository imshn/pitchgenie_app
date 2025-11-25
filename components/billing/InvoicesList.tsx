"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, FileText } from "lucide-react";
import { format } from "date-fns";

interface Invoice {
    id: string;
    amount: number;
    currency: string;
    status: string;
    date: number;
    pdfUrl: string;
    description: string;
}

export function InvoicesList() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const user = auth.currentUser;
                if (!user) return;
                const token = await user.getIdToken();
                const res = await axios.get("/api/billing/invoices", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setInvoices(res.data.invoices);
            } catch (error) {
                console.error("Failed to fetch invoices", error);
            } finally {
                setLoading(false);
            }
        };

        const unsub = auth.onAuthStateChanged((user) => {
            if (user) fetchInvoices();
        });

        return () => unsub();
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (invoices.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>View and download your past invoices</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Invoice</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell>
                                    {format(new Date(invoice.date), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell>
                                    {new Intl.NumberFormat("en-IN", {
                                        style: "currency",
                                        currency: invoice.currency,
                                    }).format(invoice.amount)}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            invoice.status === "paid"
                                                ? "default" // default is usually primary/black
                                                : invoice.status === "issued"
                                                    ? "secondary"
                                                    : "destructive"
                                        }
                                        className={
                                            invoice.status === "paid"
                                                ? "bg-green-500 hover:bg-green-600"
                                                : ""
                                        }
                                    >
                                        {invoice.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {invoice.pdfUrl && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(invoice.pdfUrl, "_blank")}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
