"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { BillingContent } from "@/components/billing/BillingContent";
import { SubscriptionManager } from "@/components/billing/SubscriptionManager";
import { InvoicesList } from "@/components/billing/InvoicesList";

export default function BillingSettingsPage() {
    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col space-y-8">
                <BillingContent />
                <SubscriptionManager />
                <InvoicesList />
            </div>
        </div>
    );
}
