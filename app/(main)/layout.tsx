import { AppShell } from "@/components/layout/AppShell";
import { TourProvider } from "@/components/tour/TourProvider";
import { Tour } from "@/components/tour/Tour";
import Toaster from "@/components/ui/toaster";
import "../globals.css";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TourProvider>
      <AppShell>
        {children}
        <Toaster />
        <Tour />
      </AppShell>
    </TourProvider>
  );
}
