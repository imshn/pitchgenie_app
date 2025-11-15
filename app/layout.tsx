import Sidebar from "@/components/SideNav";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import Navbar from "@/components/Navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
      

        {/* Sidebar */}
        <Sidebar />

        {/* Page content */}
        <main className="ml-32 w-full min-h-screen">
          {children}
        </main>

        <Toaster />
      </body>
    </html>
  );
}
