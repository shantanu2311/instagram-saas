"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useMemo } from "react";
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
  CalendarHeart,
  RefreshCw,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { StrategySummaryCard } from "@/components/dashboard/strategy-summary-card";
import { TodaysContentCard } from "@/components/dashboard/todays-content-card";
import { WeeklyStrip } from "@/components/dashboard/weekly-strip";
import { YesterdaysPerformance } from "@/components/dashboard/yesterdays-performance";
import { QuickActionsBar } from "@/components/dashboard/quick-actions-bar";
import { WeeklyBriefDialog } from "@/components/dashboard/weekly-brief-dialog";
import { ExternalPostDialog } from "@/components/dashboard/external-post-dialog";
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

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

interface SyncExternalPost {
  id: string;
  caption: string;
  timestamp: string;
  mediaType: string;
  permalink?: string;
  likes: number;
  comments: number;
}

interface DashboardStats {
  isNewUser: boolean;
  hasBrand: boolean;
  brandId: string | null;
  hasInstagram: boolean;
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
  // Strategy lifecycle
  strategyReviewDue: boolean;
  strategyAge: number | null;
  strategyCycle: number | null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Creator";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyBrief, setWeeklyBrief] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<{
    total: number;
    synced: number;
    externalPosts: SyncExternalPost[];
  } | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importingAll, setImportingAll] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const monday = useMemo(() => getMonday(), []);

  const fetchStats = useCallback(() => {
    fetch("/api/dashboard/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchBrief = useCallback(() => {
    fetch(`/api/briefs?weekStart=${encodeURIComponent(monday)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setWeeklyBrief)
      .catch(() => {});
  }, [monday]);

  useEffect(() => {
    fetchStats();
    fetchBrief();
  }, [fetchStats, fetchBrief]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/instagram/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSyncResults(data);
        setLastSyncedAt(new Date());
      }
    } catch {
      // silently fail
    } finally {
      setSyncing(false);
    }
  }

  async function importPost(post: SyncExternalPost): Promise<boolean> {
    try {
      const res = await fetch("/api/instagram/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          igMediaId: post.id,
          caption: post.caption,
          mediaType: post.mediaType.toLowerCase(),
          timestamp: post.timestamp,
          likes: post.likes,
          comments: post.comments,
        }),
      });
      if (res.ok) {
        setSyncResults((prev) =>
          prev
            ? {
                ...prev,
                synced: prev.synced + 1,
                externalPosts: prev.externalPosts.filter((p) => p.id !== post.id),
              }
            : null
        );
        return true;
      }
    } catch {
      // silently fail
    }
    return false;
  }

  async function handleImportPost(post: SyncExternalPost) {
    setImportingId(post.id);
    await importPost(post);
    setImportingId(null);
    fetchStats();
  }

  async function handleImportAll() {
    if (!syncResults?.externalPosts.length) return;
    setImportingAll(true);
    const posts = [...syncResults.externalPosts];
    await Promise.allSettled(posts.map((post) => importPost(post)));
    setImportingAll(false);
    fetchStats();
  }

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
                      Welcome to Kuraite
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

            {/* Strategy Review Banner */}
            {stats?.strategyReviewDue && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      30-Day Strategy Review Due
                      {stats.strategyCycle && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          Cycle {stats.strategyCycle} &middot; {stats.strategyAge} days ago
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      AI will evaluate your goals vs performance and recommend improvements for the next cycle
                    </p>
                  </div>
                  <Link href="/strategy/review-cycle">
                    <Button size="sm" variant="outline" className="border-amber-500/30 hover:bg-amber-500/10">
                      Review Now
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* 1. Today's Content Card (hero) */}
            <TodaysContentCard slot={stats?.todaySlot ?? null} onSlotUpdated={fetchStats} />

            {/* Weekly Brief prompt */}
            {!weeklyBrief && stats?.hasBrand && (
              <Card className="border-border/40 border-dashed">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-ig-pink/10 flex items-center justify-center">
                    <CalendarHeart className="h-5 w-5 text-ig-pink" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Weekly Brief</p>
                    <p className="text-xs text-muted-foreground">Tell the AI about this week&apos;s launches, events, or trends</p>
                  </div>
                  <WeeklyBriefDialog brandId={stats?.brandId || ""} weekStart={monday} onSave={fetchBrief} />
                </CardContent>
              </Card>
            )}

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

            {/* 3b. Instagram Sync (only when IG connected) */}
            {stats?.hasInstagram && (
              <Card className="border-border/40">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Instagram Sync</CardTitle>
                    <div className="flex items-center gap-2">
                      <ExternalPostDialog onLogged={fetchStats} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={syncing}
                        className="gap-2"
                      >
                        {syncing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        {syncing ? "Syncing..." : "Sync Instagram"}
                      </Button>
                    </div>
                  </div>
                  {lastSyncedAt && (
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                      Last synced: {lastSyncedAt.toLocaleTimeString()}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {syncResults ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Found {syncResults.total} posts on Instagram
                          {syncResults.synced > 0 &&
                            ` (${syncResults.synced} already tracked)`}
                          {syncResults.externalPosts.length > 0 &&
                            ` — ${syncResults.externalPosts.length} external`}
                        </p>
                        {syncResults.externalPosts.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleImportAll}
                            disabled={importingAll}
                            className="gap-1 text-xs"
                          >
                            {importingAll ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : null}
                            Import All ({syncResults.externalPosts.length})
                          </Button>
                        )}
                      </div>

                      {syncResults.externalPosts.length > 0 && (
                        <div className="space-y-2">
                          {syncResults.externalPosts.map((post) => (
                            <div
                              key={post.id}
                              className="flex items-start justify-between gap-3 py-2 border-b border-border/30 last:border-0"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] uppercase font-medium text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
                                    {post.mediaType}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(post.timestamp).toLocaleDateString()}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {post.likes} likes &middot; {post.comments} comments
                                  </span>
                                </div>
                                <p className="text-sm truncate">
                                  {post.caption || "No caption"}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {post.permalink && (
                                  <a
                                    href={post.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleImportPost(post)}
                                  disabled={importingId === post.id}
                                  className="text-xs h-7"
                                >
                                  {importingId === post.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Log Post"
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {syncResults.externalPosts.length === 0 && (
                        <p className="text-xs text-emerald-500">
                          All Instagram posts are tracked!
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Click &ldquo;Sync Instagram&rdquo; to check for posts made outside the app, or log one manually.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

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
