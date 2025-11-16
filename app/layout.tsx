// app/layout.tsx
import "@/app/globals.css";
import Sidebar from "@/components/SideNav";
import Toaster from "@/components/ui/toaster";
export const metadata = {
  title: "PitchGenie",
  description: "AI cold email builder",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}