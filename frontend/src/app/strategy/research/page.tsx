"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Search,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Hash,
  ThumbsUp,
  ThumbsDown,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DeepDiveChat } from "@/components/strategy/deep-dive-chat";

const researchSteps = [
  { label: "Analyzing your business", icon: Building2 },
  { label: "Researching competitor accounts", icon: Search },
  { label: "Finding viral content in your niche", icon: TrendingUp },
  { label: "Analyzing content patterns", icon: BarChart3 },
  { label: "Identifying content gaps", icon: Lightbulb },
  { label: "Generating insights", icon: Sparkles },
];

export default function ResearchPage() {
  const router = useRouter();
  const {
    profile,
    researchStatus,
    researchResults,
    setResearchStatus,
    setResearchProgress,
    setResearchResults,
    setStrategy,
  } = useStrategyStore();

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [showDeepDive, setShowDeepDive] = useState(true);
  const [deepDiveAnswers, setDeepDiveAnswers] = useState<
    Array<{ question: string; answer: string }> | undefined
  >(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeStepRef = useRef(0);
  const fetchCalledRef = useRef(false);

  // Animate steps while AI research is running
  useEffect(() => {
    if (researchStatus !== "running") return;

    intervalRef.current = setInterval(() => {
      const current = activeStepRef.current;
      if (current >= researchSteps.length - 1) {
        // Stay on last step (spinner) until API returns
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      const next = current + 1;
      activeStepRef.current = next;
      setCompletedSteps((cs) => [...cs, current]);
      setActiveStep(next);
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [researchStatus]);

  // Call AI research API when status becomes "running"
  useEffect(() => {
    if (researchStatus !== "running" || fetchCalledRef.current) return;
    fetchCalledRef.current = true;

    const doResearch = async () => {
      try {
        const res = await fetch("/api/strategy/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Research failed");
        }
        // Complete all remaining steps visually
        setCompletedSteps(researchSteps.map((_, i) => i));
        setActiveStep(researchSteps.length);
        setResearchResults(data);
        setResearchProgress(100);
        setResearchStatus("complete");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Research failed";
        console.error("Research error:", message);
        setResearchError(message);
        setResearchStatus("error");
      }
    };

    doResearch();
  }, [researchStatus, profile, setResearchResults, setResearchProgress, setResearchStatus]);

  // If idle (direct navigation), start research — run only on mount
  const statusRef = useRef(researchStatus);
  statusRef.current = researchStatus;
  useEffect(() => {
    if (statusRef.current === "idle") {
      const id = setTimeout(() => setResearchStatus("running"), 0);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = researchResults ?? {
    competitors: [],
    trends: { hashtags: [], viralExamples: [], trendingFormats: [] },
    insights: [],
  };

  const handleGenerateStrategy = async (
    answers?: Array<{ question: string; answer: string }>
  ) => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/strategy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          researchResults: results,
          ...(answers ? { deepDiveAnswers: answers } : deepDiveAnswers ? { deepDiveAnswers } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Strategy generation failed (${res.status})`);
      }
      setStrategy(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Strategy generation failed";
      setGenerateError(message);
      setGenerating(false);
      return;
    }
    setGenerating(false);
    router.push("/strategy/review");
  };

  // Error state
  if (researchStatus === "error") {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Lightbulb className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Research Failed</h2>
          <p className="text-sm text-muted-foreground">
            {researchError || "Something went wrong. Please try again."}
          </p>
          <Button
            onClick={() => {
              fetchCalledRef.current = false;
              setResearchError(null);
              setActiveStep(0);
              activeStepRef.current = 0;
              setCompletedSteps([]);
              setResearchStatus("running");
            }}
            size="lg"
          >
            Retry Research
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (researchStatus === "running") {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Researching your niche</h2>
            <p className="text-sm text-muted-foreground">
              AI is researching real data about your niche and competitors. This may take 1-2 minutes.
            </p>
          </div>

          <Card>
            <CardContent className="py-2 space-y-1">
              {researchSteps.map((step, i) => {
                const completed = completedSteps.includes(i);
                const active = i === activeStep;
                const pending = !completed && !active;

                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: active || completed ? 1 : 0.5 }}
                    className="flex items-center gap-3 py-2.5"
                  >
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : active ? (
                      <Loader2 className="h-5 w-5 text-ig-pink animate-spin shrink-0" />
                    ) : (
                      <step.icon className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        completed
                          ? "text-foreground"
                          : active
                            ? "text-foreground font-medium"
                            : "text-muted-foreground/40"
                      }`}
                    >
                      {step.label}
                    </span>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Complete state — show results
  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Research Complete</h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what we found about your niche and competitors.
        </p>
      </div>

      {/* Competitor Analysis */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-5 w-5 text-ig-pink" />
            Competitor Analysis
          </h2>
          <span className="text-[10px] text-muted-foreground/60 bg-muted/30 rounded-full px-2.5 py-0.5">
            Works with public Business &amp; Creator accounts only
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.competitors.map((comp: any) => (
            <Card key={comp.handle}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {comp.name && comp.name !== comp.handle ? (
                    <>
                      {comp.name}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        @{comp.handle}
                      </span>
                    </>
                  ) : (
                    <>@{comp.handle}</>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">
                      {comp.followers >= 1_000_000
                        ? `${(comp.followers / 1_000_000).toFixed(1)}M`
                        : comp.followers >= 1_000
                          ? `${(comp.followers / 1_000).toFixed(1)}K`
                          : comp.followers}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Followers
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{comp.engagementRate}%</p>
                    <p className="text-[10px] text-muted-foreground">
                      Engagement
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {comp.postingFrequency}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Frequency
                    </p>
                  </div>
                </div>

                {/* Content type bar */}
                <div className="flex h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-ig-pink"
                    style={{ width: `${comp.topContentTypes.reels}%` }}
                  />
                  <div
                    className="bg-blue-500"
                    style={{ width: `${comp.topContentTypes.carousels}%` }}
                  />
                  <div
                    className="bg-ig-orange"
                    style={{ width: `${comp.topContentTypes.images}%` }}
                  />
                </div>
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-ig-pink" />
                    Reels
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Carousels
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-ig-orange" />
                    Images
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {comp.strengths.map((s: string) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px]"
                    >
                      <ThumbsUp className="h-2.5 w-2.5 mr-1" />
                      {s}
                    </span>
                  ))}
                  {comp.weaknesses.map((w: string) => (
                    <span
                      key={w}
                      className="inline-flex items-center rounded-full bg-red-500/10 text-red-500 px-2 py-0.5 text-[10px]"
                    >
                      <ThumbsDown className="h-2.5 w-2.5 mr-1" />
                      {w}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Trend Insights */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-ig-pink" />
          Trend Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Trending Hashtags */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Hash className="h-4 w-4 text-ig-orange" />
                Trending Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {results.trends.hashtags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex rounded-full bg-ig-pink/10 text-ig-pink px-2.5 py-0.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Viral Examples */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-ig-orange" />
                Viral Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.trends.viralExamples.map((ex: any) => (
                <div key={ex.topic} className="text-sm space-y-0.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">
                      {ex.type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {ex.views} views
                    </span>
                  </div>
                  <p className="text-xs">{ex.topic}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Trending Formats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-ig-orange" />
                Trending Formats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.trends.trendingFormats.map((f: any) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{f.name}</span>
                  <span className="text-emerald-500 text-xs font-medium">
                    {f.growth}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Insights */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-ig-pink" />
          Key Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {results.insights.map((insight: any, i: number) => (
            <Card key={i} size="sm">
              <CardContent className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] tabular-nums"
                  >
                    {insight.confidence}%
                  </Badge>
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm">{insight.text}</p>
                  {insight.actionable && (
                    <span className="text-[10px] text-ig-pink font-medium">
                      Actionable
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Deep Dive or CTA */}
      {showDeepDive && !generating ? (
        <div className="pt-4 pb-8">
          <DeepDiveChat
            discoveryProfile={profile}
            onComplete={(answers) => {
              setDeepDiveAnswers(answers);
              setShowDeepDive(false);
              handleGenerateStrategy(answers);
            }}
            onSkip={() => {
              setShowDeepDive(false);
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 pt-4 pb-8">
          <Button
            onClick={() => handleGenerateStrategy()}
            disabled={generating}
            size="lg"
            className="px-8 gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Strategy...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate My Strategy
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
          {generateError && (
            <p className="text-sm text-destructive text-center max-w-md">
              {generateError}. Please check your AI configuration and try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
