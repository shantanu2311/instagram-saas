"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wand2,
  Calendar,
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  FileText,
  Clock,
  Send,
} from "lucide-react";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { StrategySummaryCard } from "@/components/dashboard/strategy-summary-card";
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
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Creator";

  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => {});
  }, []);

  const isNewUser = stats?.isNewUser ?? true;

  const kpis = [
    { label: "Posts This Week", value: stats ? `${stats.postsThisWeek} / 7` : "—", icon: ImageIcon, color: "text-ig-pink" },
    { label: "Drafts", value: stats ? String(stats.drafts) : "—", icon: FileText, color: "text-blue-500" },
    { label: "In Queue", value: stats ? String(stats.queued) : "��", icon: Clock, color: "text-ig-orange" },
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

        {isNewUser ? (
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
            {/* KPIs for active users */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StrategySummaryCard />
              <OnboardingChecklist />
            </div>

            {/* Recent Content */}
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

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/studio">
            <Card className="border-border/40 hover:border-ig-pink/30 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-ig-pink" />
                  Content Studio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Generate images, reels, and captions with AI. Choose Standard
                  or AI-Enhanced generation.
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/calendar">
            <Card className="border-border/40 hover:border-ig-pink/30 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Content Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  View and manage your posting schedule. Drag and drop to
                  reschedule.
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/analytics">
            <Card className="border-border/40 hover:border-ig-pink/30 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-500" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Track performance across posts, pillars, and time. Get
                  AI-powered recommendations.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
