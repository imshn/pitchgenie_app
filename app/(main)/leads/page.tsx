// app/leads/page.tsx
import AuthGuard from "@/components/AuthGuard";
import LeadTable from "@/components/LeadTable";

export default function LeadsPage() {
  return (
    <AuthGuard>
      <div className="glass card">
        <h2 className="text-xl font-semibold">Leads</h2>
        <p className="text-gray-300 mt-2">All your uploaded leads</p>

        <div className="mt-6">
          <LeadTable />
        </div>
      </div>
    </AuthGuard>
  );
}