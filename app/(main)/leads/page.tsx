import AuthGuard from "@/components/AuthGuard";
import LeadTable from "@/components/LeadTable";

export default function LeadsPage() {
  return (
    <AuthGuard>
      <main className="pl-64 min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Leads</h1>
            <p className="text-muted-foreground">Manage and track all your outreach leads</p>
          </div>

          <div className="rounded-lg border border-border shadow-premium overflow-hidden">
            <LeadTable />
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
