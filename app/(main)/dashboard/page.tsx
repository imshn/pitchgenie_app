import AuthGuard from "@/components/AuthGuard";
import { BarChart3, FileStack, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <AuthGuard>
      <main className="pl-64 min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to your command center</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass border border-border rounded-lg p-6 shadow-premium hover:bg-secondary/40 transition-colors duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-semibold text-foreground mt-2">0</p>
                </div>
                <div className="p-2 bg-primary/15 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>

            <div className="glass border border-border rounded-lg p-6 shadow-premium hover:bg-secondary/40 transition-colors duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Templates</p>
                  <p className="text-2xl font-semibold text-foreground mt-2">0</p>
                </div>
                <div className="p-2 bg-primary/15 rounded-lg">
                  <FileStack className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>

            <div className="glass border border-border rounded-lg p-6 shadow-premium hover:bg-secondary/40 transition-colors duration-150">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Credits</p>
                  <p className="text-2xl font-semibold text-foreground mt-2">—</p>
                </div>
                <div className="p-2 bg-primary/15 rounded-lg">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="glass border border-border rounded-lg p-6 shadow-premium">
              <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="flex flex-col gap-3">
                <Link
                  href="/upload"
                  className="px-4 py-3 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150 text-center"
                >
                  Upload CSV
                </Link>
                <button className="px-4 py-3 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150">
                  Generate Batch
                </button>
                <button className="px-4 py-3 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150">
                  Export Results
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass border border-border rounded-lg p-6 shadow-premium">
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
              <p className="text-muted-foreground text-sm">No recent activity. Start by uploading leads.</p>
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
