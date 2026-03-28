"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wand2,
  ArrowRight,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Clock,
  Send,
} from "lucide-react";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { StrategySummaryCard } from "@/components/dashboard/strategy-summary-card";
import { TodaysContentCard } from "@/components/dashboard/todays-content-card";
import { WeeklyStrip } from "@/components/dashboard/weekly-strip";
import { YesterdaysPerformance } from "@/components/dashboard/yesterdays-performance";
import { QuickActionsBar } from "@/components/dashboard/quick-actions-bar";
import { PageTransition } from "@/components/page-transition";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

interface DashboardStats {
  isNewUser: boolean;
  hasBrand: boolean;
  postsThisWeek: number;
  totalContent: number;
  drafts: number;
  queued: number;
  published: number;
  recentContent: Array<{
    id: string;
    contentType: string;
    caption: string | null;
    status: string;
    qualityScore: number | null;
    createdAt: string;
  }>;
  // Daily Cockpit
  todaySlot: {
    id: string;
    date: string;
    pillar: string;
    contentType: string;
    topic: string;
    headline: string;
    suggestedTime: string;
    status: string;
  } | null;
  weekSlots: Array<{
    id: string;
    date: string;
    pillar: string;
    contentType: string;
    topic: string;
    status: string;
  }>;
  yesterdayPost: {
    id: string;
    contentType: string;
    caption: string | null;
    thumbnailUrl: string | null;
    qualityScore: number | null;
    analytics: {
      likes: number;
      comments: number;
      saves: number;
      shares: number;
      engagement: number;
    } | null;
  } | null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Creator";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => {
    fetch("/api/dashboard/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const isNewUser = stats?.isNewUser ?? true;

  const kpis = [
    { label: "Posts This Week", value: stats ? `${stats.postsThisWeek} / 7` : "—", icon: ImageIcon, color: "text-ig-pink" },
    { label: "Drafts", value: stats ? String(stats.drafts) : "—", icon: FileText, color: "text-blue-500" },
    { label: "In Queue", value: stats ? String(stats.queued) : "—", icon: Clock, color: "text-ig-orange" },
    { label: "Published", value: stats ? String(stats.published) : "—", icon: Send, color: "text-emerald-500" },
  ];

  return (
    <PageTransition>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {userName}!
            </h1>
            <p className="text-sm text-muted-foreground">{formatDate()}</p>
          </div>
          <Link href="/studio">
            <Button>
              <Wand2 className="h-4 w-4 mr-2" />
              Create Content
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 rounded-xl bg-muted/50" />
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-muted/30" />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-muted/30" />
              ))}
            </div>
          </div>
        ) : isNewUser ? (
          <>
            {/* Welcome hero for new users */}
            <Card className="border-border/40 bg-gradient-to-br from-ig-pink/5 via-ig-orange/5 to-transparent">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="h-14 w-14 rounded-2xl ig-gradient flex items-center justify-center shrink-0">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h2 className="text-lg font-semibold">
                      Welcome to IGCreator
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Let&apos;s get you set up. Start by creating your content
                      strategy — our AI will research your niche, analyze
                      competitors, and build a custom posting plan.
                    </p>
                  </div>
                  <Link href="/strategy">
                    <Button size="lg">
                      Create Strategy
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Onboarding checklist (primary focus) + Strategy summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OnboardingChecklist />
              <StrategySummaryCard />
            </div>

            {/* KPIs (muted for new users) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi) => (
                <Card key={kpi.label} className="border-border/40 opacity-60">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {kpi.label}
                        </p>
                        <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                      </div>
                      <div
                        className={`h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center ${kpi.color}`}
                      >
                        <kpi.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center -mt-2">
              Connect your Instagram account to start tracking real metrics
            </p>
          </>
        ) : (
          <>
            {/* ─── Daily Creative Cockpit ─────────────────────────── */}

            {/* 1. Today's Content Card (hero) */}
            <TodaysContentCard slot={stats?.todaySlot ?? null} onSlotUpdated={fetchStats} />

            {/* 2. Weekly Strip */}
            {stats?.weekSlots && stats.weekSlots.length > 0 && (
              <WeeklyStrip slots={stats.weekSlots} />
            )}

            {/* 3. KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi) => (
                <Card key={kpi.label} className="border-border/40">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {kpi.label}
                        </p>
                        <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                      </div>
                      <div
                        className={`h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center ${kpi.color}`}
                      >
                        <kpi.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 4. Yesterday's Performance */}
            <YesterdaysPerformance post={stats?.yesterdayPost ?? null} />

            {/* 5. Quick Actions */}
            <QuickActionsBar />

            {/* 6. Strategy + Onboarding (for users still completing setup) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StrategySummaryCard />
              <OnboardingChecklist />
            </div>

            {/* 7. Recent Content */}
            {stats?.recentContent && stats.recentContent.length > 0 && (
              <Card className="border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recent Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.recentContent.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[10px] uppercase font-medium text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
                            {item.contentType}
                          </span>
                          <p className="text-sm truncate">
                            {item.caption
                              ? item.caption.slice(0, 60) + (item.caption.length > 60 ? "..." : "")
                              : "Untitled"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.qualityScore && (
                            <span className="text-[10px] text-emerald-500 font-medium">
                              {item.qualityScore}/100
                            </span>
                          )}
                          <span
                            className={`text-[10px] rounded-full px-2 py-0.5 ${
                              item.status === "published"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : item.status === "queued"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
