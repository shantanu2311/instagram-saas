"use client";

import Link from "next/link";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  Rocket,
  Calendar,
  TrendingUp,
  RefreshCw,
  Pencil,
  Target,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { motion } from "framer-motion";

export default function StrategyPage() {
  const { strategy, calendar } = useStrategyStore();

  if (!strategy) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <Card>
            <CardContent className="text-center py-12 space-y-6">
              <div className="mx-auto h-16 w-16 rounded-2xl ig-gradient flex items-center justify-center">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">
                  Set Up Your Content Strategy
                </h1>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Answer a few questions about your business, and we'll research
                  your niche, analyze competitors, and build a custom content
                  strategy with a full posting calendar.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Link href="/strategy/discovery">
                  <Button size="lg" className="px-8 gap-2">
                    <Rocket className="h-4 w-4" />
                    Start Discovery
                  </Button>
                </Link>
                <span className="text-xs text-muted-foreground">
                  Takes about 5 minutes
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Strategy exists — show summary dashboard
  const pillars: string[] = strategy.contentPillars?.map(
    (p: any) => p.name
  ) ?? ["Education", "Entertainment", "Promotion"];
  const pillarColors = [
    "bg-ig-pink/10 text-ig-pink",
    "bg-blue-500/10 text-blue-500",
    "bg-ig-orange/10 text-ig-orange",
    "bg-emerald-500/10 text-emerald-500",
    "bg-amber-500/10 text-amber-500",
  ];

  const milestones = strategy.milestones
    ? [
        { label: "30-Day", progress: 0, kpi: strategy.milestones.day30?.followers ?? "Set goal" },
        { label: "60-Day", progress: 0, kpi: strategy.milestones.day60?.engagement ?? "Set goal" },
        { label: "90-Day", progress: 0, kpi: strategy.milestones.day90?.followers ?? "Set goal" },
      ]
    : [];

  const trendInsights: { title: string; category: string }[] = [];

  const upcomingSlots = calendar?.slots?.slice(0, 4) ?? [];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Strategy</h1>
          <p className="text-sm text-muted-foreground">
            Your personalized Instagram growth plan
          </p>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Content Pillars */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-ig-pink" />
              Content Pillars
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {pillars.map((p, i) => (
              <span
                key={p}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${pillarColors[i % pillarColors.length]}`}
              >
                {p}
              </span>
            ))}
          </CardContent>
        </Card>

        {/* This Week's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-ig-pink" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingSlots.length > 0 ? upcomingSlots.map((slot: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-3 text-sm"
              >
                <span className="text-xs font-medium text-muted-foreground w-8">
                  {slot.day ?? slot.dayOfWeek}
                </span>
                <div className="h-2 w-2 rounded-full bg-ig-pink" />
                <span className="text-xs text-muted-foreground">
                  {slot.type ?? slot.contentType}
                </span>
                <span className="flex-1 truncate">{slot.topic}</span>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground">
                No calendar yet. Approve your strategy to generate a content calendar.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ig-pink" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {milestones.length > 0 ? milestones.map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{m.label}</span>
                  <span className="text-muted-foreground">{m.kpi}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-ig-pink transition-all"
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground">
                Milestones will appear after your strategy is generated.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Trending Now */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-ig-pink" />
              Trending Now
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {trendInsights.length > 0 ? trendInsights.map((t) => (
              <div
                key={t.title}
                className="flex items-start gap-2 text-sm"
              >
                <Circle className="h-1.5 w-1.5 mt-1.5 fill-ig-orange text-ig-orange shrink-0" />
                <div>
                  <p className="text-sm">{t.title}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {t.category}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground">
                Trend insights will appear once your strategy is active and we analyze your niche.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/strategy/calendar">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            View Full Calendar
          </Button>
        </Link>
        <Link href="/strategy/review">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit Strategy
          </Button>
        </Link>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Trends
        </Button>
      </div>
    </div>
  );
}
