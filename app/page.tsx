import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket, Zap, BarChart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="#">
          <Rocket className="h-6 w-6" />
          <span className="sr-only">PitchGenie</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/login"
          >
            Login
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/signup"
          >
            Sign Up
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Generate Personalized Cold Emails in Seconds
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  PitchGenie uses AI to analyze your leads and craft unique,
                  engaging emails that get replies.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/signup">
                  <Button size="lg">Get Started for Free</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-gray-200 px-3 py-1 text-sm dark:bg-gray-700">
                    Features
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                    Why You&apos;ll Love PitchGenie
                  </h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    Stop wasting time on generic templates. Start sending emails
                    that actually convert.
                  </p>
                </div>
              </div>
              <div className="col-span-2 grid items-start gap-6">
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-6 w-6" />
                    <h3 className="text-xl font-bold">AI-Powered Generation</h3>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Our AI analyzes your lead&apos;s company and role to write a
                    hyper-personalized email.
                  </p>
                </div>
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <BarChart className="h-6 w-6" />
                    <h3 className="text-xl font-bold">Bulk Processing</h3>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Upload a CSV of your leads and generate hundreds of
                    personalized emails at once.
                  </p>
                </div>
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-6 w-6" />
                    <h3 className="text-xl font-bold">Follow-ups Included</h3>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Not just the first touchpoint, but a follow-up email is
                    also generated for each lead.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 PitchGenie. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
