"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Lightbulb,
  Wand2,
  Send,
  ArrowRight,
  Globe,
  AtSign,
  Hash,
  Check,
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { IPhoneMockup } from "@/components/landing/iphone-mockup";
import { KuraiteIcon, KuraiteWordmark } from "@/components/kuraite-logo";

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

export default function LandingPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <KuraiteIcon size={32} />
            <KuraiteWordmark />
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
              AI Instagram Strategy &amp; Growth Engine
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Your Instagram{" "}
              <span className="bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] bg-clip-text text-transparent">
                growth strategist
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              AI builds your strategy, researches competitors, plans your calendar, generates content, and posts it — all on autopilot. You just approve.
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

          {/* Right 40% — Product showcase (Brew & Co. coffee brand) */}
          <div className="lg:col-span-2 flex justify-center">
            <div className="relative w-[420px] h-[560px]">
              {/* Glow effect behind */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent rounded-3xl blur-3xl" />

              {/* Main card: Calendar view */}
              <div className="absolute top-0 left-0 right-0 z-10 rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Calendar header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">B</span>
                    </div>
                    <span className="text-white text-sm font-semibold">Brew &amp; Co. Calendar</span>
                  </div>
                  <span className="text-xs text-white/40">April 2026</span>
                </div>
                {/* Calendar mini grid */}
                <div className="px-5 py-4">
                  <div className="grid grid-cols-7 gap-1.5 mb-2">
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                      <span key={i} className="text-[11px] text-white/30 text-center font-medium">{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 28 }, (_, i) => {
                      const hasPost = [0, 2, 4, 7, 9, 11, 14, 16, 18, 21, 23, 25].includes(i);
                      const isToday = i === 2;
                      // Amber=Brew Methods, Pink=Behind the Bar, Emerald=Community
                      const colors = ["bg-amber-500", "bg-pink-500", "bg-emerald-500", "bg-amber-500"];
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-lg flex items-center justify-center text-[11px] ${
                            isToday
                              ? "bg-amber-500 text-white font-bold ring-2 ring-amber-400"
                              : hasPost
                              ? `${colors[i % 4]}/20 text-white/70`
                              : "bg-white/5 text-white/20"
                          }`}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Today's slot */}
                <div className="px-5 pb-4">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex gap-3">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/hero-post-bg.jpg" alt="" className="h-full w-full object-cover" />
                      <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">94</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] text-amber-300 font-medium">Brew Methods</span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-[10px] text-purple-300 font-medium">Carousel</span>
                      </div>
                      <p className="text-[13px] text-white font-medium leading-tight truncate">Pour-Over vs French Press — Which Wins?</p>
                      <p className="text-[11px] text-white/40">8:30 AM &middot; Auto-post scheduled</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating card: Analytics & Growth (bottom-left) */}
              <div className="absolute bottom-8 -left-10 z-20 rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl p-3.5 w-[190px]">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[11px] text-white/50 font-medium">This Week</p>
                  <span className="text-[10px] text-emerald-400 font-medium">+31% reach</span>
                </div>
                {/* Mini chart bars */}
                <div className="flex items-end gap-1 h-12 mb-2.5">
                  {[35, 42, 38, 55, 48, 62, 70].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${i === 6 ? "bg-gradient-to-t from-amber-500 to-orange-500" : "bg-white/15"}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
                    <p className="text-xs font-bold text-white">3.2K</p>
                    <p className="text-[9px] text-white/40">Followers</p>
                  </div>
                  <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
                    <p className="text-xs font-bold text-emerald-400">5.1%</p>
                    <p className="text-[9px] text-white/40">Eng. Rate</p>
                  </div>
                </div>
              </div>

              {/* Floating card: Competitor Research (bottom-right) */}
              <div className="absolute bottom-0 -right-8 z-20 rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl p-3.5 w-[195px]">
                <p className="text-[11px] text-white/50 font-medium mb-2.5">Competitor Intel</p>
                <div className="space-y-2">
                  {[
                    { handle: "@bluestonelane", rate: "3.8%", trend: true },
                    { handle: "@stumptown", rate: "4.2%", trend: true },
                    { handle: "@onyxcoffee", rate: "6.1%", trend: false },
                  ].map((c) => (
                    <div key={c.handle} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-500/40 to-orange-500/40" />
                        <span className="text-[11px] text-white/70">{c.handle}</span>
                      </div>
                      <span className={`text-[11px] font-medium ${c.trend ? "text-emerald-400" : "text-white/30"}`}>
                        {c.rate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating card: Strategy badge (top-right) */}
              <div className="absolute -top-3 -right-6 z-20 rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl p-3.5 w-[170px]">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-white font-semibold">AI Strategy</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { pillar: "Brew Methods", pct: 40, color: "bg-amber-500" },
                    { pillar: "Behind the Bar", pct: 35, color: "bg-pink-500" },
                    { pillar: "Community", pct: 25, color: "bg-emerald-500" },
                  ].map((p) => (
                    <div key={p.pillar} className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/60">{p.pillar}</span>
                        <span className="text-[10px] text-white/40">{p.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value prop bar */}
      <section className="border-y border-border/40 py-6 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ig-pink" />
            <span>Competitor Research</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-ig-orange" />
            <span>30-Day Strategy Cycles</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-ig-purple" />
            <span>AI Content &amp; Auto-Post</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">
            How it works
          </h2>
          <p className="text-center text-muted-foreground mb-16">
            From strategy to posting in three simple steps
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Strategy */}
            <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4 hover:border-purple-500/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl ig-gradient flex items-center justify-center shrink-0">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-medium text-ig-pink uppercase tracking-wider">Step 1</span>
                  <h3 className="font-semibold text-base">Set Your Strategy</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI researches your niche, analyzes competitors, and builds a 30-day content plan with pillars, schedule, and growth milestones.
              </p>
              {/* Mini strategy preview — Brew & Co. coffee brand */}
              <div className="rounded-xl bg-neutral-900 border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50 font-medium">Content Pillars</span>
                  <span className="text-xs text-emerald-400 font-medium">Active</span>
                </div>
                {[
                  { name: "Brew Methods", pct: 40, color: "from-amber-500 to-amber-600" },
                  { name: "Behind the Bar", pct: 35, color: "from-pink-500 to-pink-600" },
                  { name: "Community", pct: 25, color: "from-emerald-500 to-emerald-600" },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-2.5">
                    <span className="text-xs text-white/60 w-32 shrink-0">{p.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${p.color}`} style={{ width: `${p.pct}%` }} />
                    </div>
                    <span className="text-xs text-white/40 w-8 text-right">{p.pct}%</span>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  {["5 posts/week", "Competitor Intel", "90-day plan"].map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-white/5 text-[11px] text-white/40">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Generate */}
            <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4 hover:border-pink-500/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl ig-gradient flex items-center justify-center shrink-0">
                  <Wand2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-medium text-ig-pink uppercase tracking-wider">Step 2</span>
                  <h3 className="font-semibold text-base">Generate Content</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI creates captions, hashtags, and images for every calendar slot. Each post passes a quality gate before it reaches you.
              </p>
              {/* Mini content preview — Brew & Co. */}
              <div className="rounded-xl bg-neutral-900 border border-white/10 p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hero-post-bg.jpg" alt="" className="h-full w-full object-cover" />
                    <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">94</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">Pour-Over vs French Press</p>
                    <p className="text-xs text-white/50 mt-0.5 line-clamp-2">Which brewing method brings out more flavor?</p>
                    <div className="flex gap-1.5 mt-1.5">
                      <span className="text-[11px] text-blue-400">#specialtycoffee</span>
                      <span className="text-[11px] text-blue-400">#pourover</span>
                      <span className="text-[11px] text-white/30">+6</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {["Hook", "Caption", "Hashtags", "Brand", "CTA"].map((c, i) => (
                    <div key={c} className="text-center">
                      <div className={`h-1.5 rounded-full mb-1 ${i < 4 ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span className="text-[11px] text-white/30">{c}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 py-1.5 rounded-md bg-white/5 text-center text-xs text-white/40 font-medium">Edit</div>
                  <div className="flex-1 py-1.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-center text-xs text-white font-medium">Approve</div>
                </div>
              </div>
            </div>

            {/* Step 3: Auto-Post & Grow */}
            <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4 hover:border-orange-500/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl ig-gradient flex items-center justify-center shrink-0">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-medium text-ig-pink uppercase tracking-wider">Step 3</span>
                  <h3 className="font-semibold text-base">Post & Grow</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Posts go live at optimal times. Track engagement, see what&apos;s working, and let AI refine your strategy every 30 days.
              </p>
              {/* Mini analytics preview — Brew & Co. */}
              <div className="rounded-xl bg-neutral-900 border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50 font-medium">This Week</span>
                  <span className="text-xs text-emerald-400 font-medium">+31%</span>
                </div>
                <div className="flex items-end gap-1 h-10">
                  {[30, 45, 35, 60, 52, 72, 80].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${i >= 5 ? "bg-gradient-to-t from-amber-500 to-orange-500" : "bg-white/15"}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Reach", value: "8.4K", trend: "+31%" },
                    { label: "Likes", value: "612", trend: "+24%" },
                    { label: "Saves", value: "89", trend: "+47%" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-md bg-white/5 px-2 py-1.5 text-center">
                      <p className="text-sm font-bold text-white">{m.value}</p>
                      <p className="text-[10px] text-emerald-400">{m.trend}</p>
                      <p className="text-[10px] text-white/30">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs text-amber-300">AI review due in 12 days</span>
                </div>
              </div>
            </div>
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

          {/* Feature 1: Strategy — Fitness coach example */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-ig-pink bg-ig-pink/10 rounded-full px-3 py-1">
                <Lightbulb className="h-3.5 w-3.5" />
                Strategy Engine
              </div>
              <h3 className="text-2xl font-bold">AI Content Strategy</h3>
              <p className="text-muted-foreground leading-relaxed">
                Upload your brand materials, connect your IG page, add your website URL — and our AI absorbs everything. It analyzes competitors, studies your existing content, and builds a strategy rooted in what makes your brand unique.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Analyzes your current IG page — posts, engagement & what works",
                  "Scrapes your website for brand voice, products & messaging",
                  "Upload brand docs, product catalogs & collateral",
                  "Add moments, launches & content inspirations",
                  "Competitor research & niche analysis",
                  "90-day growth plan with milestones",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-ig-pink shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-ig-pink/20 via-ig-orange/10 to-ig-pink/5 border border-ig-pink/10 p-6 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
              {/* Background image — fitness creator */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/feature-fitness.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
              <div className="relative z-10 bg-card/90 backdrop-blur-lg rounded-xl border border-border/40 p-5 w-full max-w-[300px] space-y-3 shadow-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/feature-fitness.jpg" alt="" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">@fitwithjess</p>
                    <p className="text-[10px] text-muted-foreground">Building strategy from your brand...</p>
                  </div>
                </div>
                {/* Data sources feeding into strategy */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Sources Analyzed</p>
                  {[
                    { icon: "🌐", label: "Website scraped", detail: "fitwithjess.com" },
                    { icon: "📱", label: "IG page analyzed", detail: "342 posts, 4.8% eng." },
                    { icon: "📄", label: "Brand materials", detail: "3 docs uploaded" },
                    { icon: "🎯", label: "Competitors found", detail: "@kayla_itsines +2" },
                    { icon: "💡", label: "Content ideas", detail: "12 saved inspirations" },
                    { icon: "📅", label: "Brand moments", detail: "Summer launch Jun 15" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
                      <span className="text-xs">{s.icon}</span>
                      <span className="text-[11px] text-foreground/80 flex-1">{s.label}</span>
                      <span className="text-[10px] text-muted-foreground">{s.detail}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-4/5 rounded-full ig-gradient animate-pulse" />
                  </div>
                  <span className="text-[10px] text-ig-pink font-medium">Generating strategy...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Analytics — Fashion brand example */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-500/5 border border-emerald-500/10 p-6 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
              {/* Background image — fashion brand */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/feature-fashion.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              <div className="relative z-10 bg-card/90 backdrop-blur-lg rounded-xl border border-border/40 p-5 w-full max-w-[300px] space-y-3 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/feature-fashion.jpg" alt="" className="h-full w-full object-cover object-top" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">@stylehaus</p>
                      <p className="text-[10px] text-muted-foreground">Fashion Brand</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-500 font-semibold">+18%</span>
                </div>
                <div className="flex items-end gap-1 h-14">
                  {[40, 55, 35, 70, 60, 80, 75].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${i >= 5 ? "bg-gradient-to-t from-emerald-500 to-teal-400" : "bg-emerald-500/20"}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Reach", value: "24.1K", trend: "+18%" },
                    { label: "Engagement", value: "6.3%", trend: "+0.8%" },
                    { label: "New Followers", value: "+420", trend: "this week" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-sm font-bold">{s.value}</p>
                      <p className="text-[10px] text-emerald-500">{s.trend}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400">Reels outperform carousels 2.3x this month</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-4">
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
                  "Real-time metrics synced from Instagram",
                  "Per-post & per-pillar performance breakdown",
                  "AI-powered insights — what to do more, what to drop",
                  "30-day strategy review cycle with auto-recommendations",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3: Studio — Food creator example */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-ig-orange bg-ig-orange/10 rounded-full px-3 py-1">
                <Wand2 className="h-3.5 w-3.5" />
                Content Studio
              </div>
              <h3 className="text-2xl font-bold">Generate Content Instantly</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every post is generated from your strategy — aligned with your pillars, goals, and brand voice. AI writes captions, picks hashtags, and generates images using the best tools available. You just review and approve.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Captions, hashtags & CTAs aligned to your strategy",
                  "Integrates the best AI image generation tools on the market",
                  "Reel scripts with timed scenes & voiceover",
                  "Repurpose blogs & long-form into IG formats",
                  "10-criteria quality gate before every post",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-ig-orange shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-ig-orange/20 via-amber-500/10 to-ig-orange/5 border border-ig-orange/10 p-6 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
              {/* Background image — food creator */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/feature-food.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
              <div className="relative z-10 bg-card/90 backdrop-blur-lg rounded-xl border border-border/40 p-5 w-full max-w-[300px] space-y-3 shadow-2xl">
                <div className="flex gap-3">
                  <div className="relative h-24 w-24 rounded-lg overflow-hidden shrink-0 shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/feature-food.jpg" alt="" className="h-full w-full object-cover" />
                    <div className="absolute top-1 right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                      <span className="text-[9px] font-bold text-white">96</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-semibold truncate">Homemade Sourdough — A Visual Guide</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">Golden crust, soft crumb. Here&apos;s how to nail it every time...</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className="text-[10px] text-blue-400">#sourdough</span>
                      <span className="text-[10px] text-blue-400">#breadmaking</span>
                      <span className="text-[10px] text-muted-foreground">+5</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {["Hook", "Caption", "Hashtags", "Brand", "CTA"].map((c, i) => (
                    <div key={c} className="text-center">
                      <div className={`h-1.5 rounded-full mb-0.5 ${i < 5 ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span className="text-[10px] text-muted-foreground">{c}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 py-1.5 rounded-lg bg-muted text-center text-xs text-muted-foreground font-medium">Edit</div>
                  <div className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-center text-xs text-white font-medium shadow">Approve</div>
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

      {/* Early Access */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-ig-pink/30 text-sm text-ig-pink bg-ig-pink/5">
            <Sparkles className="h-3.5 w-3.5" />
            Early Access
          </div>
          <h2 className="text-3xl font-bold">
            Be among the first creators to try Kuraite
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            We&apos;re onboarding creators who want to grow on Instagram with
            AI-powered content strategy and generation. Join the waitlist.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="h-12 px-8">
              Join Early Access
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
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
              AI-powered strategy, content generation, and auto-posting
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
              <KuraiteIcon size={32} />
              <KuraiteWordmark />
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

          {/* Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/data-deletion"
                  className="hover:text-foreground transition-colors"
                >
                  Data Deletion
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@suprajanan.com"
                  className="hover:text-foreground transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-border/40 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Kuraite. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
