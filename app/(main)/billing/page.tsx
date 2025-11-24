"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { BillingContent } from "@/components/billing/BillingContent";
import { SubscriptionManager } from "@/components/billing/SubscriptionManager";

export default function BillingPage() {
  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Billing & Usage"
        description="Manage your subscription and view credit usage."
      />
      <BillingContent />
      <SubscriptionManager />
    </div>
  );
}
