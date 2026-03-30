"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Lightbulb,
  Target,
  BarChart3,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useBrand } from "@/lib/hooks/use-brand";

interface Evaluation {
  goalsSet?: string[];
  goalsAchieved?: string[];
  goalsNotMet?: string[];
  postsPublished: number;
  postsPlanned: number;
  completionRate?: number;
  avgEngagement: number;
  bestPerforming?: { pillar: string; type: string; reason: string };
  worstPerforming?: { pillar: string; type: string; reason: string };
  keyLearnings: string[];
}

interface Recommendation {
  area: string;
  change: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

interface ReviewData {
  evaluation: Evaluation;
  recommendations: Recommendation[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updatedStrategy: any;
  summary: string;
  currentCycle: number;
  approvedAt: string | null;
}

const priorityColors = {
  high: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const areaLabels: Record<string, string> = {
  pillars: "Content Pillars",
  formats: "Content Formats",
  cadence: "Posting Cadence",
  tone: "Tone & Voice",
  hashtags: "Hashtags",
  content_mix: "Content Mix",
};

export default function StrategyReviewCyclePage() {
  const router = useRouter();
  const { brand, loading: brandLoading } = useBrand();
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [acceptedRecs, setAcceptedRecs] = useState<Set<number>>(new Set());
  const [expandedRec, setExpandedRec] = useState<number | null>(null);

  // Auto-fetch review when brand loads
  useEffect(() => {
    if (brand?.id && !review && !loading) {
      fetchReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand?.id]);

  async function fetchReview() {
    if (!brand?.id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/strategy/review-cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: brand.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Review failed" }));
        throw new Error(err.error || "Failed to generate review");
      }

      const data = await res.json();
      setReview(data);

      // Default: accept all recommendations
      const allIndices = new Set<number>(
        data.recommendations.map((_: Recommendation, i: number) => i)
      );
      setAcceptedRecs(allIndices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate review");
    } finally {
      setLoading(false);
    }
  }

  function toggleRec(index: number) {
    setAcceptedRecs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleApply() {
    if (!brand?.id || !review) return;
    setApplying(true);

    try {
      // 1. Save updated strategy
      const res = await fetch("/api/strategy/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand.id,
          strategy: review.updatedStrategy,
        }),
      });

      if (!res.ok) throw new Error("Failed to save updated strategy");

      // 2. Generate new 30-day calendar starting today
      const calRes = await fetch("/api/strategy/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: brand.id,
          niche: brand.niche,
          brandName: brand.name,
          strategy: review.updatedStrategy,
          postsPerWeek: review.updatedStrategy.postingCadence?.postsPerWeek || 5,
        }),
      });

      if (!calRes.ok) {
        console.error("Calendar generation failed after strategy update");
      }

      // 3. Redirect to dashboard
      router.push("/dashboard/calendar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply changes");
    } finally {
      setApplying(false);
    }
  }

  if (brandLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand?.id) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h2 className="text-xl font-semibold">No Brand Found</h2>
        <p className="mt-2 text-muted-foreground">
          Set up your brand first to start a strategy cycle.
        </p>
        <Button className="mt-4" onClick={() => router.push("/onboarding")}>
          Set Up Brand
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          30-Day Strategy Review
        </h1>
        <p className="mt-1 text-muted-foreground">
          {review
            ? `Cycle ${review.currentCycle} evaluation — reviewing performance and planning next 30 days`
            : "Analyzing your last 30 days of content performance..."}
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              AI is evaluating your strategy performance...
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              This may take 15-30 seconds
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-rose-500/20">
          <CardContent className="py-8 text-center">
            <XCircle className="mx-auto h-8 w-8 text-rose-500" />
            <p className="mt-2 text-sm text-rose-500">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={fetchReview}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review content */}
      {review && !loading && (
        <>
          {/* Executive Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {review.summary}
              </p>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Posts Published</p>
                <p className="mt-1 text-2xl font-bold">
                  {review.evaluation.postsPublished}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{review.evaluation.postsPlanned}
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Completion Rate</p>
                <p className="mt-1 text-2xl font-bold">
                  {review.evaluation.completionRate ||
                    (review.evaluation.postsPlanned > 0
                      ? Math.round(
                          (review.evaluation.postsPublished /
                            review.evaluation.postsPlanned) *
                            100
                        )
                      : 0)}
                  %
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Avg Engagement</p>
                <p className="mt-1 text-2xl font-bold">
                  {review.evaluation.avgEngagement}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Strategy Cycle</p>
                <p className="mt-1 text-2xl font-bold">#{review.currentCycle}</p>
              </CardContent>
            </Card>
          </div>

          {/* Best / Worst Performing */}
          {(review.evaluation.bestPerforming || review.evaluation.worstPerforming) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {review.evaluation.bestPerforming && (
                <Card className="border-emerald-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Best Performing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Badge variant="outline">{review.evaluation.bestPerforming.pillar}</Badge>
                      <Badge variant="outline">{review.evaluation.bestPerforming.type}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {review.evaluation.bestPerforming.reason}
                    </p>
                  </CardContent>
                </Card>
              )}
              {review.evaluation.worstPerforming && (
                <Card className="border-rose-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                      Needs Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Badge variant="outline">{review.evaluation.worstPerforming.pillar}</Badge>
                      <Badge variant="outline">{review.evaluation.worstPerforming.type}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {review.evaluation.worstPerforming.reason}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Key Learnings */}
          {review.evaluation.keyLearnings?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4" />
                  Key Learnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.evaluation.keyLearnings.map((learning, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {learning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Goals Review */}
          {(review.evaluation.goalsAchieved?.length || review.evaluation.goalsNotMet?.length) ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4" />
                  Goals Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {review.evaluation.goalsAchieved?.map((goal, i) => (
                  <div key={`a-${i}`} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{goal}</span>
                  </div>
                ))}
                {review.evaluation.goalsNotMet?.map((goal, i) => (
                  <div key={`m-${i}`} className="flex items-start gap-2 text-sm">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    <span className="text-muted-foreground">{goal}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {/* Recommendations */}
          {review.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4" />
                  Recommendations for Next Cycle
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Toggle recommendations on/off before applying
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {review.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 transition-all ${
                      acceptedRecs.has(i)
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/50 opacity-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={priorityColors[rec.priority]}
                          >
                            {rec.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {areaLabels[rec.area] || rec.area}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-medium">{rec.change}</p>
                        {expandedRec === i && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {rec.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            setExpandedRec(expandedRec === i ? null : i)
                          }
                        >
                          {expandedRec === i ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant={acceptedRecs.has(i) ? "default" : "outline"}
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => toggleRec(i)}
                        >
                          {acceptedRecs.has(i) ? (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Accept
                            </>
                          ) : (
                            "Reject"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div>
              <p className="text-sm font-medium">
                Ready to start Cycle {(review.currentCycle || 1) + 1}?
              </p>
              <p className="text-xs text-muted-foreground">
                This will update your strategy and generate a new 30-day calendar
                starting today.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                Later
              </Button>
              <Button onClick={handleApply} disabled={applying}>
                {applying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Apply & Generate Calendar
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
