/**
 * Tour Steps Configuration
 * Defines all steps in the product tour
 */

export interface TourStep {
  id: string;
  target: string; // data-tour attribute value
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
  showWelcome?: boolean;
  navigateTo?: string; // Optional: navigate to this route before showing the step
}

export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    target: "",
    title: "Welcome to PitchGenie! 🎉",
    description: "Let's take a quick tour to help you get started with AI-powered lead outreach.",
    showWelcome: true,
  },
  {
    id: "upload",
    target: "upload",
    title: "Upload Your Leads",
    description: "Start by uploading your lead list. We support CSV files with contact information.",
    placement: "bottom",
    navigateTo: "/dashboard",
  },
  {
    id: "lead-table",
    target: "lead-table",
    title: "Manage Your Leads",
    description: "View and organize all your leads in one place. Click on any lead to see details.",
    placement: "top",
    navigateTo: "/leads",
  },
  {
    id: "ai-buttons",
    target: "ai-buttons",
    title: "AI-Powered Generation",
    description: "Generate personalized emails using our AI. Each email is tailored to your lead's profile.",
    placement: "left",
    navigateTo: "/leads",
  },
  {
    id: "pipeline",
    target: "pipeline",
    title: "Track Your Pipeline",
    description: "Move deals through stages and manage your sales pipeline visually.",
    placement: "right",
    navigateTo: "/leads",
  },
  {
    id: "analytics",
    target: "analytics",
    title: "View Analytics",
    description: "Track your campaign performance, credit usage, and engagement metrics.",
    placement: "right",
    navigateTo: "/dashboard",
  },
  {
    id: "profile",
    target: "profile",
    title: "Manage Your Account",
    description: "Access your profile, billing settings, and subscription details here.",
    placement: "bottom",
    navigateTo: "/dashboard",
  },
];
