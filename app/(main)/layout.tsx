import { AppShell } from "@/components/layout/AppShell";
import Toaster from "@/components/ui/toaster";
import "../globals.css";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      {children}
      <Toaster />
    </AppShell>
  );
}
