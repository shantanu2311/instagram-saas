"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Globe,
  Heart,
  MessageCircle,
  TrendingUp,
  Award,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Layers,
  Video,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { PERIOD_OPTIONS } from "@/lib/constants";

interface AnalyticsData {
  kpis: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    avgEngagement: number;
    bestType: string;
  };
  engagementOverTime: Array<{
    date: string;
    likes: number;
    comments: number;
    engagement: number;
  }>;
  byContentType: Array<{
    type: string;
    avgLikes: number;
    avgComments: number;
    avgEngagement: number;
    count: number;
  }>;
  topPosts: Array<{
    id: string;
    caption: string;
    contentType: string;
    likes: number;
    comments: number;
    engagement: number;
    postedAt: string;
  }>;
}

const typeIcons: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  carousel: Layers,
  reel: Video,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: "var(--color-card, white)",
        border: "1px solid var(--color-border)",
        borderRadius: "10px",
        boxShadow: "0 4px 12px -2px rgba(0,0,0,0.1)",
        padding: "10px 14px",
      }}
    >
      <p className="text-xs font-medium mb-1">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [insights, setInsights] = useState<string[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const fetchAnalytics = useCallback(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  async function generateInsights() {
    if (!data) return;
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/analytics/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analyticsData: {
            kpis: data.kpis,
            byContentType: data.byContentType,
            topPosts: data.topPosts.slice(0, 3),
            engagementOverTime: data.engagementOverTime.length,
          },
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setInsights(result.insights || []);
      }
    } catch {
      // silently fail
    } finally {
      setInsightsLoading(false);
    }
  }

  const hasData = data && data.kpis.totalPosts > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your Instagram performance and get AI insights
          </p>
        </div>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                period === p.value
                  ? "border-border bg-muted/60 text-foreground shadow-sm"
                  : "border-transparent text-muted-foreground/60 hover:text-muted-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
          <div className="h-[400px] rounded-xl bg-muted/30 animate-pulse" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasData && (
        <Card className="border-border/40">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-ig-orange/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-ig-orange" />
              </div>
              <p className="text-sm font-medium">No analytics data yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Publish posts and sync your Instagram to see performance data.
                Use Instagram Sync on your dashboard to import post metrics.
              </p>
              <Link href="/settings" className="mt-4">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Connect Instagram
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard content */}
      {!loading && hasData && data && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              { label: "Total Posts", value: String(data.kpis.totalPosts), icon: BarChart3, color: "blue-500" },
              { label: "Total Likes", value: data.kpis.totalLikes.toLocaleString(), icon: Heart, color: "ig-pink" },
              { label: "Total Comments", value: data.kpis.totalComments.toLocaleString(), icon: MessageCircle, color: "ig-orange" },
              { label: "Best Type", value: data.kpis.bestType, icon: Award, color: "emerald-500", capitalize: true },
            ] as Array<{ label: string; value: string; icon: LucideIcon; color: string; capitalize?: boolean }>).map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
                      <p className={`text-2xl font-bold mt-1${kpi.capitalize ? " capitalize" : ""}`}>
                        {kpi.value}
                      </p>
                    </div>
                    <div className={`h-10 w-10 rounded-lg bg-${kpi.color}/10 flex items-center justify-center`}>
                      <kpi.icon className={`h-5 w-5 text-${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Engagement Over Time */}
          {data.engagementOverTime.length > 1 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Engagement Over Time
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Likes and comments per post
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart
                    data={data.engagementOverTime}
                    margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="var(--color-muted-foreground)"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="var(--color-muted-foreground)"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="likes"
                      name="Likes"
                      stroke="#DD2A7B"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="comments"
                      name="Comments"
                      stroke="#F58529"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Performance by Content Type */}
          {data.byContentType.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Performance by Content Type
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Average engagement per post type
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={data.byContentType}
                    margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                    />
                    <XAxis
                      dataKey="type"
                      tick={{ fontSize: 11 }}
                      stroke="var(--color-muted-foreground)"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="var(--color-muted-foreground)"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      dataKey="avgLikes"
                      name="Avg Likes"
                      fill="#DD2A7B"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="avgComments"
                      name="Avg Comments"
                      fill="#F58529"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Posts */}
            {data.topPosts.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Top Performing Posts
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-1">
                  {data.topPosts.map((post, i) => {
                    const Icon = typeIcons[post.contentType] || ImageIcon;
                    return (
                      <div
                        key={post.id}
                        className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0"
                      >
                        <span className="text-xs font-mono text-muted-foreground w-4">
                          {i + 1}
                        </span>
                        <div className="h-8 w-8 rounded-md bg-muted/30 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">
                            {post.caption || "No caption"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(post.postedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="flex items-center gap-1 text-xs">
                            <Heart className="h-3 w-3 text-ig-pink" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <MessageCircle className="h-3 w-3 text-ig-orange" />
                            {post.comments}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* AI Insights */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-ig-purple" />
                    AI Insights
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateInsights}
                    disabled={insightsLoading}
                    className="gap-1.5 text-xs"
                  >
                    {insightsLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {insightsLoading ? "Analyzing..." : "Generate Insights"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {insightsLoading && (
                  <div className="space-y-3 py-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-4 rounded bg-muted/30 animate-pulse"
                        style={{ width: `${80 - i * 10}%` }}
                      />
                    ))}
                  </div>
                )}
                {!insightsLoading && insights.length === 0 && (
                  <div className="py-8 text-center">
                    <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Click &ldquo;Generate Insights&rdquo; to get AI-powered
                      analysis of your content performance
                    </p>
                  </div>
                )}
                {!insightsLoading && insights.length > 0 && (
                  <ul className="space-y-3 py-2">
                    {insights.map((insight, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-ig-pink font-bold text-xs mt-0.5">
                          •
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {insight}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
