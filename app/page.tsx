'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket, Zap, BarChart, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link className="flex items-center gap-2 font-semibold text-lg" href="/">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary-foreground" />
            </div>
            <span>PitchGenie</span>
          </Link>
          <nav className="hidden md:flex gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          </nav>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-8 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">Join 2,000+ sales teams already using PitchGenie</span>
              </div>

              {/* Main heading */}
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                  Generate Personalized Cold Emails
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mt-2">
                    That Actually Get Replies
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  PitchGenie uses AI to analyze your leads and craft unique, engaging emails. Stop wasting time on templates. Start converting leads.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2">
                    Get Started for Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline">Learn More</Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-col sm:flex-row gap-6 pt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  <span>100+ leads per month free</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="relative w-full py-20 md:py-32 border-t border-border">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border">
                <span className="text-sm text-accent font-medium">Features</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Everything you need to win more deals
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Powerful features designed specifically for sales teams who want to scale their outreach without sacrificing personalization
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {/* Feature 1 */}
              <div className="group glass glass-hover p-8 rounded-xl transition-all duration-300">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI-Powered Generation</h3>
                <p className="text-muted-foreground">
                  Our advanced AI analyzes your lead&apos;s company, role, and profile to write hyper-personalized emails that feel authentic and human-written.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group glass glass-hover p-8 rounded-xl transition-all duration-300">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 mb-4 group-hover:bg-accent/20 transition-colors">
                  <BarChart className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Bulk Processing</h3>
                <p className="text-muted-foreground">
                  Upload a CSV of your leads and generate hundreds of personalized emails in minutes. No more copy-paste. Pure automation.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group glass glass-hover p-8 rounded-xl transition-all duration-300">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Follow-up Sequences</h3>
                <p className="text-muted-foreground">
                  Not just first touchpoints. Get follow-up emails generated automatically to keep leads warm and maximize your reply rates.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative w-full py-20 md:py-32 border-t border-border">
          <div className="container mx-auto px-4 md:px-6">
            <div className="glass p-12 md:p-16 rounded-2xl text-center space-y-8 max-w-2xl mx-auto">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your outreach?</h2>
                <p className="text-lg text-muted-foreground">
                  Join thousands of sales professionals who are already using PitchGenie to close more deals with less effort.
                </p>
              </div>
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2">
                  Start Your Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                <Rocket className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">PitchGenie</span>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </nav>
            <p className="text-xs text-muted-foreground">
              © 2025 PitchGenie. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
