import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientAuthWrapper from "./clientAuthWrapper";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "PitchGenie - Enterprise Lead Management",
  description:
    "Premium AI-powered lead outreach platform. Enterprise-grade email, LinkedIn, and sequence automation."
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${geist.variable} ${geistMono.variable} dark`}>
      <body className="font-sans antialiased">
        <ClientAuthWrapper>{children}</ClientAuthWrapper>
      </body>
    </html>
  );
}