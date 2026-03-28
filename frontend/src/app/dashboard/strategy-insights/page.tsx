"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Check,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { PERIOD_OPTIONS } from "@/lib/constants";

interface PerformanceSummary {
  bestPillar: { name: string; avgEngagement: number };
  worstPillar: { name: string; avgEngagement: number };
  bestType: { name: string; avgEngagement: number };
  worstType: { name: string; avgEngagement: number };
}

interface Recommendation {
  id: string;
  text: string;
  type: "increase" | "decrease" | "adjust";
  target: string;
  currentValue?: number | null;
  suggestedValue?: number | null;
}

interface MonthlyReview {
  totalPosts: number;
  avgEngagement: number;
  trend: "up" | "down" | "stable";
  highlight: string;
}

interface InsightsData {
  performanceSummary: PerformanceSummary;
  recommendations: Recommendation[];
  monthlyReview: MonthlyReview;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: "text-emerald-500",
  down: "text-red-500",
  stable: "text-muted-foreground",
};

const recTypeIcons = {
  increase: ArrowUpRight,
  decrease: ArrowDownRight,
  adjust: RefreshCw,
};

const recTypeColors = {
  increase: "text-emerald-500 bg-emerald-500/10",
  decrease: "text-red-500 bg-red-500/10",
  adjust: "text-blue-500 bg-blue-500/10",
};

export default function StrategyInsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState(30);

  const strategy = useStrategyStore((s) => s.strategy);
  const setStrategy = useStrategyStore((s) => s.setStrategy);

  const hasStrategy = strategy && strategy.contentPillars?.length > 0;

  async function fetchInsights() {
    if (!strategy) return;
    setLoading(true);
    setAppliedIds(new Set());
    try {
      const res = await fetch("/api/strategy/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStrategy: strategy, period }),
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function applyRecommendation(rec: Recommendation) {
    if (!strategy) return;

    // Try to apply the recommendation to strategy store
    if (rec.type === "increase" || rec.type === "decrease") {
      // Update content format percentages if target matches
      const formats = strategy.contentFormats;
      if (formats && rec.suggestedValue !== null && rec.suggestedValue !== undefined) {
        const target = rec.target.toLowerCase();
        if (target.includes("reel") || target.includes("carousel") || target.includes("image")) {
          const key = target.includes("reel")
            ? "reels"
            : target.includes("carousel")
              ? "carousels"
              : "images";
          const updatedFormats = { ...formats, [key]: rec.suggestedValue };
          setStrategy({ ...strategy, contentFormats: updatedFormats });
        }
      }

      // Update content pillar percentages
      if (strategy.contentPillars) {
        const target = rec.target.toLowerCase();
        const pillarIndex = strategy.contentPillars.findIndex(
          (p: { name: string }) => target.includes(p.name.toLowerCase())
        );
        if (pillarIndex >= 0 && rec.suggestedValue !== null && rec.suggestedValue !== undefined) {
          const updatedPillars = [...strategy.contentPillars];
          updatedPillars[pillarIndex] = {
            ...updatedPillars[pillarIndex],
            percentage: rec.suggestedValue,
          };
          setStrategy({ ...strategy, contentPillars: updatedPillars });
        }
      }
    }

    setAppliedIds((prev) => new Set([...prev, rec.id]));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Strategy Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered analysis of your content performance and strategy
            recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  period === p.value
                    ? "border-border bg-muted/60 text-foreground shadow-sm"
                    : "border-transparent text-muted-foreground/60 hover:text-muted-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInsights}
            disabled={loading || !hasStrategy}
            className="gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {loading ? "Analyzing..." : "Analyze Performance"}
          </Button>
        </div>
      </div>

      {/* No strategy state */}
      {!hasStrategy && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No strategy found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a content strategy first, then come back for AI-powered
              insights
            </p>
            <Link
              href="/strategy"
              className="rounded-lg ig-gradient px-4 py-2 text-sm font-medium text-white"
            >
              Create Strategy
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-muted/30 animate-pulse"
              />
            ))}
          </div>
          <div className="h-48 rounded-xl bg-muted/30 animate-pulse" />
        </div>
      )}

      {/* No data yet state */}
      {hasStrategy && !loading && !data && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Ready to analyze your strategy
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click &ldquo;Analyze Performance&rdquo; to get AI-powered
              recommendations based on your content data
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && data && (
        <div className="space-y-6">
          {/* Performance Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Best Pillar
                </p>
                <p className="text-sm font-bold mt-1 capitalize">
                  {data.performanceSummary.bestPillar.name}
                </p>
                <p className="text-xs text-emerald-500 flex items-center gap-1 mt-0.5">
                  <ArrowUpRight className="h-3 w-3" />
                  {data.performanceSummary.bestPillar.avgEngagement} avg eng.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Weakest Pillar
                </p>
                <p className="text-sm font-bold mt-1 capitalize">
                  {data.performanceSummary.worstPillar.name}
                </p>
                <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                  <ArrowDownRight className="h-3 w-3" />
                  {data.performanceSummary.worstPillar.avgEngagement} avg eng.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Best Type
                </p>
                <p className="text-sm font-bold mt-1 capitalize">
                  {data.performanceSummary.bestType.name}
                </p>
                <p className="text-xs text-emerald-500 flex items-center gap-1 mt-0.5">
                  <ArrowUpRight className="h-3 w-3" />
                  {data.performanceSummary.bestType.avgEngagement} avg eng.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Weakest Type
                </p>
                <p className="text-sm font-bold mt-1 capitalize">
                  {data.performanceSummary.worstType.name}
                </p>
                <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                  <ArrowDownRight className="h-3 w-3" />
                  {data.performanceSummary.worstType.avgEngagement} avg eng.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Recommendations */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-ig-purple" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {data.recommendations.map((rec) => {
                  const Icon =
                    recTypeIcons[rec.type] || RefreshCw;
                  const colorClass =
                    recTypeColors[rec.type] || recTypeColors.adjust;
                  const isApplied = appliedIds.has(rec.id);

                  return (
                    <div
                      key={rec.id}
                      className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0"
                    >
                      <div
                        className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${colorClass}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed">{rec.text}</p>
                        {rec.currentValue !== null &&
                          rec.currentValue !== undefined &&
                          rec.suggestedValue !== null &&
                          rec.suggestedValue !== undefined && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {rec.target}: {rec.currentValue}% →{" "}
                              {rec.suggestedValue}%
                            </p>
                          )}
                      </div>
                      <Button
                        variant={isApplied ? "ghost" : "outline"}
                        size="sm"
                        onClick={() => applyRecommendation(rec)}
                        disabled={isApplied}
                        className="shrink-0 gap-1 text-[10px] h-7"
                      >
                        {isApplied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            Applied
                          </>
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                  );
                })}
                {data.recommendations.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No recommendations available. Try generating with more data.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Monthly Review */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-ig-orange" />
                  Period Review
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Posts Published
                    </span>
                    <span className="text-sm font-bold">
                      {data.monthlyReview.totalPosts}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Avg Engagement
                    </span>
                    <span className="text-sm font-bold">
                      {data.monthlyReview.avgEngagement}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Trend</span>
                    <Badge
                      variant={
                        data.monthlyReview.trend === "up"
                          ? "default"
                          : data.monthlyReview.trend === "down"
                            ? "destructive"
                            : "secondary"
                      }
                      className="gap-1"
                    >
                      {(() => {
                        const TrendIcon = trendIcons[data.monthlyReview.trend];
                        return <TrendIcon className={`h-3 w-3 ${trendColors[data.monthlyReview.trend]}`} />;
                      })()}
                      {data.monthlyReview.trend}
                    </Badge>
                  </div>
                  <div className="border-t border-border/40 pt-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {data.monthlyReview.highlight}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
