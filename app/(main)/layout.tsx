import SideNav from "@/components/SideNav";
import { Toaster } from "@/components/ui/toaster";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <SideNav />
      <main className="flex-1 p-8 overflow-auto">
        {children}
        <Toaster />
      </main>
    </div>
  );
}
