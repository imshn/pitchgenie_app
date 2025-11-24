"use client";

import AuthGuard from "@/components/AuthGuard";
import LeadTable from "@/components/LeadTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";

export default function LeadsPage() {
  return (
    <AuthGuard>
      <div className="flex flex-col h-full">
        <PageHeader 
          title="Leads" 
          description="Manage and track your potential customers."
        />
        <div className="flex-1 p-6 overflow-auto">
          <LeadTable />
        </div>
      </div>
    </AuthGuard>
  );
}
