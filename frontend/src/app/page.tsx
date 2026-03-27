"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Zap,
  BarChart3,
  Calendar,
  Image as ImageIcon,
  Video,
} from "lucide-react";

const features = [
  {
    icon: ImageIcon,
    title: "AI Image Generation",
    desc: "Branded images with your colors, fonts, and logo. Standard or AI-enhanced.",
  },
  {
    icon: Video,
    title: "Reel Creation",
    desc: "Animated reels with cinematic audio. 3 animation styles, auto-generated.",
  },
  {
    icon: Sparkles,
    title: "Smart Captions",
    desc: "AI writes captions in your brand voice with optimized hashtags.",
  },
  {
    icon: Zap,
    title: "Quality Gate",
    desc: "10-criteria validation ensures every post meets Instagram best practices.",
  },
  {
    icon: Calendar,
    title: "Auto Scheduling",
    desc: "Set your content calendar. Posts go out automatically at the best times.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Track performance across posts, pillars, and time. AI-powered recommendations.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg">IGCreator</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-3xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 text-sm text-muted-foreground bg-muted/30">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            AI-powered Instagram content platform
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
            Create Instagram content{" "}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              on autopilot
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Generate branded images, reels, and captions with AI.
            Quality-validated and auto-posted to your account. You just approve.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="h-12 px-8 text-base">
                Start Free
              </Button>
            </Link>
            <Link href="#features">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base"
              >
                See Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Everything you need to grow on Instagram
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border/40 bg-card p-6 space-y-3"
              >
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-purple-500" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Simple pricing
          </h2>
          <p className="text-center text-muted-foreground mb-16">
            Start free, upgrade when you need AI-enhanced content.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Free",
                price: "$0",
                desc: "Get started",
                features: [
                  "3 posts/week",
                  "1 IG account",
                  "Standard generation",
                  "Basic quality gate",
                ],
              },
              {
                name: "Starter",
                price: "$9",
                desc: "Daily posting",
                features: [
                  "Daily posting",
                  "1 IG account",
                  "Standard generation",
                  "Full quality gate",
                  "Scheduling",
                ],
              },
              {
                name: "Pro",
                price: "$29",
                desc: "AI-enhanced",
                popular: true,
                features: [
                  "Daily posting",
                  "3 IG accounts",
                  "50 AI credits/mo",
                  "Full quality gate",
                  "90-day analytics",
                ],
              },
              {
                name: "Agency",
                price: "$59",
                desc: "Scale up",
                features: [
                  "Daily posting",
                  "10 IG accounts",
                  "200 AI credits/mo",
                  "Custom quality gate",
                  "Team access (5)",
                ],
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-6 space-y-4 ${
                  "popular" in tier && tier.popular
                    ? "border-purple-500 bg-purple-500/5 ring-1 ring-purple-500/20"
                    : "border-border/40 bg-card"
                }`}
              >
                {"popular" in tier && tier.popular && (
                  <span className="text-[11px] font-medium text-purple-500 uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.desc}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.price !== "$0" && (
                    <span className="text-muted-foreground text-sm">/mo</span>
                  )}
                </div>
                <ul className="space-y-2 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="block mt-2">
                  <Button
                    variant={
                      "popular" in tier && tier.popular ? "default" : "outline"
                    }
                    className="w-full"
                    size="sm"
                  >
                    {tier.price === "$0" ? "Start Free" : "Get Started"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span>IGCreator</span>
          </div>
          <span>AI-powered Instagram content platform</span>
        </div>
      </footer>
    </div>
  );
}
