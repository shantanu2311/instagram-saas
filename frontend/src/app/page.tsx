"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Lightbulb,
  Wand2,
  Send,
  Star,
  ArrowRight,
  Globe,
  AtSign,
  Hash,
  Check,
} from "lucide-react";
import { IPhoneMockup } from "@/components/landing/iphone-mockup";

const pricingTiers = [
  {
    name: "Free",
    persona: "Just starting out",
    price: "$0",
    features: [
      "3 posts/week",
      "1 IG account",
      "Standard generation",
      "Basic quality gate",
    ],
  },
  {
    name: "Starter",
    persona: "Side hustlers",
    price: "$9",
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
    persona: "Full-time creators",
    price: "$29",
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
    persona: "Managing clients",
    price: "$59",
    features: [
      "Daily posting",
      "10 IG accounts",
      "200 AI credits/mo",
      "Custom quality gate",
      "Team access (5)",
    ],
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    handle: "@sarahcreates",
    quote:
      "IGCreator cut my content creation time by 80%. I went from 2 hours per post to approving AI-generated content in minutes.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    handle: "@marcusfit",
    quote:
      "The strategy engine understood my fitness niche better than I expected. My engagement rate doubled in the first month.",
    rating: 5,
  },
  {
    name: "Priya Patel",
    handle: "@priyastyle",
    quote:
      "Finally a tool that actually gets Instagram. The quality gate catches mistakes before they go live. Game changer.",
    rating: 5,
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg ig-gradient flex items-center justify-center">
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
      <section className="px-6 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          {/* Left 60% */}
          <div className="lg:col-span-3 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 text-sm text-muted-foreground bg-muted/30">
              <Sparkles className="h-3.5 w-3.5 text-ig-pink" />
              AI-powered Instagram content platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Create Instagram content{" "}
              <span className="bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] bg-clip-text text-transparent">
                on autopilot
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Generate branded images, reels, and captions with AI.
              Quality-validated and auto-posted to your account. You just
              approve.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="h-12 px-8 text-base">
                  Start Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base"
                >
                  See How It Works
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              No credit card required
            </p>
          </div>

          {/* Right 40% — iPhone mockup */}
          <div className="lg:col-span-2 flex justify-center">
            <IPhoneMockup className="w-[280px]">
              <div className="h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex flex-col">
                {/* Mock IG header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
                  <div className="h-6 w-6 rounded-full ig-gradient" />
                  <span className="text-white text-xs font-medium">
                    yourbrand
                  </span>
                </div>
                {/* Mock post image */}
                <div className="flex-1 bg-gradient-to-br from-ig-pink/30 via-ig-orange/20 to-ig-pink/30 flex items-center justify-center p-4">
                  <div className="text-center space-y-2">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">
                      Did you know?
                    </p>
                    <p className="text-sm font-bold text-white leading-tight">
                      Sleep deprivation costs $411B annually
                    </p>
                    <p className="text-[9px] text-white/50">@yourbrand</p>
                  </div>
                </div>
                {/* Mock engagement */}
                <div className="px-3 py-2 space-y-1">
                  <div className="flex gap-3">
                    <div className="h-3.5 w-3.5 rounded-full border border-white/30" />
                    <div className="h-3.5 w-3.5 rounded-full border border-white/30" />
                    <div className="h-3.5 w-3.5 rounded-full border border-white/30" />
                  </div>
                  <div className="h-2 w-16 rounded bg-white/20" />
                  <div className="h-2 w-24 rounded bg-white/10" />
                </div>
              </div>
            </IPhoneMockup>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-border/40 py-6 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex -space-x-3">
            {[
              "from-ig-pink to-ig-orange",
              "from-ig-orange to-amber-400",
              "from-emerald-400 to-teal-500",
              "from-blue-400 to-indigo-500",
              "from-ig-pink to-ig-purple",
            ].map((gradient, i) => (
              <div
                key={i}
                className={`h-9 w-9 rounded-full bg-gradient-to-br ${gradient} border-2 border-background`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Trusted by{" "}
            <span className="font-semibold text-foreground">500+</span>{" "}
            Instagram creators
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            How it works
          </h2>
          <p className="text-center text-muted-foreground mb-16">
            From strategy to posting in three simple steps
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Dashed connector line */}
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] border-t-2 border-dashed border-border/60" />

            {[
              {
                icon: Lightbulb,
                step: "1",
                title: "Set Your Strategy",
                desc: "AI analyzes your niche, competitors, and goals to build a custom content plan.",
              },
              {
                icon: Wand2,
                step: "2",
                title: "Generate Content",
                desc: "Get branded images, reels, and captions instantly. Standard or AI-enhanced.",
              },
              {
                icon: Send,
                step: "3",
                title: "Auto-Post",
                desc: "Schedule and publish automatically at the best times. You just approve.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-4 relative">
                <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center relative z-10">
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <span className="inline-block text-xs font-medium text-ig-pink bg-ig-pink/10 rounded-full px-2.5 py-0.5">
                  Step {item.step}
                </span>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — alternating layout */}
      <section id="features" className="py-24 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto space-y-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              Everything you need to grow on Instagram
            </h2>
            <p className="text-muted-foreground">
              One platform for strategy, creation, and analytics
            </p>
          </div>

          {/* Feature 1: Strategy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-ig-pink bg-ig-pink/10 rounded-full px-3 py-1">
                <Lightbulb className="h-3.5 w-3.5" />
                Strategy Engine
              </div>
              <h3 className="text-2xl font-bold">AI Content Strategy</h3>
              <p className="text-muted-foreground leading-relaxed">
                Answer a few questions about your niche and goals. Our AI
                researches competitors, identifies trending topics, and builds a
                complete content strategy with pillars, posting schedule, and
                growth milestones.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Competitor analysis",
                  "Content pillar mapping",
                  "90-day growth plan",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-ig-pink" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-ig-pink/20 via-ig-orange/10 to-ig-pink/5 border border-ig-pink/10 p-8 aspect-[4/3] flex items-center justify-center">
              <div className="bg-card/80 backdrop-blur rounded-xl border border-border/40 p-4 w-full max-w-[260px] space-y-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg ig-gradient flex items-center justify-center">
                    <Lightbulb className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-medium">Strategy Active</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Education", "Behind-the-Scenes", "Reels"].map((p) => (
                    <span
                      key={p}
                      className="text-[10px] bg-ig-pink/10 text-ig-pink rounded-full px-2 py-0.5"
                    >
                      {p}
                    </span>
                  ))}
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-1/3 rounded-full ig-gradient" />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  30-day milestone: 500 followers
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2: Studio (reversed) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 rounded-2xl bg-gradient-to-br from-ig-orange/20 via-amber-500/10 to-ig-orange/5 border border-ig-orange/10 p-8 aspect-[4/3] flex items-center justify-center">
              <div className="bg-card/80 backdrop-blur rounded-xl border border-border/40 p-4 w-full max-w-[260px] space-y-3 shadow-lg">
                <div className="aspect-[4/5] rounded-lg bg-gradient-to-br from-rose-950 to-pink-900 flex items-center justify-center">
                  <div className="text-center space-y-1 px-4">
                    <p className="text-[8px] uppercase tracking-widest text-pink-300">
                      Did you know?
                    </p>
                    <p className="text-xs font-bold text-white leading-snug">
                      Morning routines of top CEOs
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-500 font-medium">
                    Quality: 92/100
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    #productivity
                  </span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-ig-orange bg-ig-orange/10 rounded-full px-3 py-1">
                <Wand2 className="h-3.5 w-3.5" />
                Content Studio
              </div>
              <h3 className="text-2xl font-bold">Generate Content Instantly</h3>
              <p className="text-muted-foreground leading-relaxed">
                Type a topic, pick a template, and get a complete post in
                seconds. Images, carousels, reels with captions and hashtags.
                Every piece passes a 10-criteria quality gate before posting.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "6 post templates",
                  "AI-enhanced generation",
                  "10-criteria quality validation",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-ig-orange" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3: Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-500 bg-emerald-500/10 rounded-full px-3 py-1">
                <Sparkles className="h-3.5 w-3.5" />
                Analytics
              </div>
              <h3 className="text-2xl font-bold">Analytics & Growth</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track engagement, reach, and follower growth across every post.
                See which pillars and formats drive the most growth. Get
                AI-powered recommendations to optimize your strategy.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Per-post analytics",
                  "Pillar performance",
                  "AI recommendations",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-500/5 border border-emerald-500/10 p-8 aspect-[4/3] flex items-center justify-center">
              <div className="bg-card/80 backdrop-blur rounded-xl border border-border/40 p-4 w-full max-w-[260px] space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">This Week</span>
                  <span className="text-[10px] text-emerald-500">+12.4%</span>
                </div>
                <div className="flex items-end gap-1 h-16">
                  {[40, 55, 35, 70, 60, 80, 75].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-emerald-500/20"
                      style={{ height: `${h}%` }}
                    >
                      <div
                        className="w-full rounded-sm bg-emerald-500"
                        style={{ height: `${h * 0.7}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Reach", value: "12.4K" },
                    { label: "Engage", value: "4.2%" },
                    { label: "Growth", value: "+340" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-[10px] text-muted-foreground">
                        {s.label}
                      </p>
                      <p className="text-xs font-semibold">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-6 space-y-4 ${
                  tier.popular
                    ? "border-ig-pink bg-ig-pink/5 ring-1 ring-ig-pink/20"
                    : "border-border/40 bg-card"
                }`}
              >
                {tier.popular && (
                  <span className="text-[11px] font-medium text-ig-pink uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{tier.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {tier.persona}
                  </p>
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
                      <div className="h-1.5 w-1.5 rounded-full bg-ig-pink" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="block mt-2">
                  <Button
                    variant={tier.popular ? "default" : "outline"}
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

      {/* Testimonials */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Loved by creators
          </h2>
          <p className="text-center text-muted-foreground mb-16">
            See what Instagram creators are saying
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.handle}
                className="rounded-xl border border-border/40 bg-card p-6 space-y-4"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-ig-orange text-ig-orange"
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-ig-pink to-ig-orange" />
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.handle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto rounded-2xl ig-gradient p-[1px]">
          <div className="rounded-2xl bg-background p-12 text-center space-y-6">
            <h2 className="text-3xl font-bold">
              Ready to grow on Instagram?
            </h2>
            <p className="text-muted-foreground">
              Join 500+ creators using AI to build their brand
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 w-full sm:w-auto h-11 rounded-lg border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Link href="/auth/signup">
                <Button size="lg" className="h-11 px-6 whitespace-nowrap">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-6 bg-muted/10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg ig-gradient flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">IGCreator</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI-powered Instagram content platform for creators and brands.
            </p>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <Globe className="h-4 w-4" />
              </div>
              <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <AtSign className="h-4 w-4" />
              </div>
              <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <Hash className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="#features"
                  className="hover:text-foreground transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="hover:text-foreground transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/signup"
                  className="hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/signup"
                  className="hover:text-foreground transition-colors"
                >
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-foreground transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-border/40 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} IGCreator. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
