'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket, Zap, BarChart, ArrowRight, CheckCircle2, Mail, Users, Globe } from 'lucide-react';
import { LandingNavbar } from "@/components/LandingNavbar";
import { MagicCard } from "@/components/ui/magic-card";
import { Marquee } from "@/components/ui/marquee";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20">
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-8 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Trusted by 2,000+ sales teams</span>
              </div>

              {/* Main heading */}
              <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
                  Cold Emails That <br />
                  <span className="text-gradient">Actually Get Replies</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Stop wasting time on templates. PitchGenie uses AI to analyze your leads and craft hyper-personalized emails that convert.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 shadow-glow hover:shadow-lg hover:shadow-primary/25 transition-all">
                    Get Started for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base glass hover:bg-secondary/50">
                    View Demo
                  </Button>
                </Link>
              </div>

              {/* 3D Dashboard Preview (Mockup) */}
              <div className="w-full max-w-5xl mt-16 perspective-1000 animate-in fade-in zoom-in duration-1000 delay-300">
                <div className="relative rounded-xl border border-border bg-card/50 shadow-2xl transform-style-3d rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent rounded-xl pointer-events-none" />
                  <img 
                    src="https://ui.shadcn.com/placeholder.svg" 
                    alt="Dashboard Preview" 
                    className="w-full h-auto rounded-xl opacity-90"
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent h-1/2 bottom-0" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Marquee */}
        <section className="py-12 border-y border-border bg-secondary/20">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-muted-foreground mb-8">TRUSTED BY INNOVATIVE TEAMS AT</p>
            <Marquee pauseOnHover className="[--duration:20s]">
              {['Acme Corp', 'GlobalTech', 'Nebula', 'Vertex', 'Horizon', 'Pinnacle'].map((company) => (
                <div key={company} className="mx-8 text-xl font-bold text-muted-foreground/50 flex items-center gap-2">
                  <Globe className="h-6 w-6" />
                  {company}
                </div>
              ))}
            </Marquee>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative w-full py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Supercharge Your Outreach
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Everything you need to scale your sales process without losing the human touch.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 h-[500px]">
              <MagicCard className="p-8 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">AI Personalization</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Our AI analyzes LinkedIn profiles, company news, and website content to write emails that look 100% human-researched.
                  </p>
                </div>
                <div className="mt-8 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-lg border border-border/50" />
              </MagicCard>

              <MagicCard className="p-8 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Bulk Processing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Upload your lead lists and generate thousands of personalized drafts in minutes. Export directly to your favorite sending tool.
                  </p>
                </div>
                <div className="mt-8 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-lg border border-border/50" />
              </MagicCard>

              <MagicCard className="p-8 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Mail className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Smart Sequences</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Don't just send one email. Create multi-touch sequences with automated follow-ups that adapt based on recipient behavior.
                  </p>
                </div>
                <div className="mt-8 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-lg border border-border/50" />
              </MagicCard>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative w-full py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="glass-card p-12 md:p-20 rounded-3xl text-center space-y-8 max-w-4xl mx-auto border border-primary/20 shadow-glow">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                  Ready to 10x your reply rates?
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Join the top 1% of sales teams using AI to personalize at scale.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Link href="/signup">
                  <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground pt-4">
                No credit card required · 14-day free trial · Cancel anytime
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Rocket className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">PitchGenie</span>
            </div>
            <nav className="flex gap-8 text-sm font-medium text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2025 PitchGenie. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
