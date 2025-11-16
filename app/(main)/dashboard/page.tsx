// app/dashboard/page.tsx
import AuthGuard from "@/components/AuthGuard";

export default function Dashboard() {
  return (
    <AuthGuard>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass card">
          <h3 className="text-lg font-semibold">Leads</h3>
          <p className="text-gray-300 mt-2">Manage leads, view generated emails and statuses.</p>
        </div>

        <div className="glass card">
          <h3 className="text-lg font-semibold">Templates</h3>
          <p className="text-gray-300 mt-2">Save and reuse templates for outreach sequences.</p>
        </div>

        <div className="glass card">
          <h3 className="text-lg font-semibold">Credits</h3>
          <p className="text-gray-300 mt-2">Track usage & billing.</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass card">
          <h4 className="font-semibold">Quick Actions</h4>
          <div className="mt-3 flex flex-wrap gap-3">
            <a href="/upload" className="px-4 py-2 rounded-md bg-white/8">Upload CSV</a>
            <button className="px-4 py-2 rounded-md bg-white/8">Generate Batch</button>
            <button className="px-4 py-2 rounded-md bg-white/8">Export CSV</button>
          </div>
        </div>

        <div className="glass card">
          <h4 className="font-semibold">Recent Activity</h4>
          <p className="text-gray-300 mt-3">No recent activity — generate some emails!</p>
        </div>
      </div>
    </AuthGuard>
  );
}