"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Hash,
  Search,
  Copy,
  Check,
  TrendingUp,
  Target,
  Zap,
  Sparkles,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { useBrand } from "@/lib/hooks/use-brand";

interface HashtagTag {
  tag: string;
  reach: "high" | "medium" | "niche";
  competition: "high" | "medium" | "low";
}

interface HashtagSet {
  category: string;
  tags: HashtagTag[];
}

interface HashtagResult {
  sets: HashtagSet[];
  recommended: string[];
  banned: string[];
  tip: string;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Hash; color: string; bgColor: string }> = {
  Branded: { icon: Sparkles, color: "text-ig-pink", bgColor: "bg-ig-pink/10" },
  Niche: { icon: Target, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  Reach: { icon: TrendingUp, color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
  Trending: { icon: Zap, color: "text-amber-500", bgColor: "bg-amber-500/10" },
};

const REACH_COLORS: Record<string, string> = {
  high: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  niche: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const COMPETITION_COLORS: Record<string, string> = {
  high: "text-rose-500",
  medium: "text-amber-500",
  low: "text-emerald-500",
};

export default function HashtagExplorerPage() {
  const [topic, setTopic] = useState("");
  const [researching, setResearching] = useState(false);
  const [result, setResult] = useState<HashtagResult | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const { strategy } = useStrategyStore();
  const { brand: savedBrand } = useBrand();

  const handleResearch = async () => {
    setResearching(true);
    setResult(null);
    setSelectedTags(new Set());
    try {
      const strategyContext = strategy
        ? {
            brandPositioning: strategy.brandPositioning,
            contentPillars: strategy.contentPillars?.map((p) => ({
              name: p.name,
              percentage: p.percentage,
              rationale: p.rationale,
            })),
            toneAndVoice: strategy.toneAndVoice,
            hashtagStrategy: strategy.hashtagStrategy,
          }
        : null;

      const res = await fetch("/api/studio/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          niche: savedBrand.niche,
          brand_name: savedBrand.brandHashtag?.replace("#", "") || "",
          content_pillars: savedBrand.contentPillars,
          brand_hashtag: savedBrand.brandHashtag,
          strategy: strategyContext,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      // Auto-select recommended tags (capped at 30)
      const recommended = Array.isArray(data.recommended) ? data.recommended.slice(0, 30) : [];
      setSelectedTags(new Set(recommended));
    } catch (err) {
      console.error("Hashtag research error:", err);
    } finally {
      setResearching(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else if (next.size < 30) {
        next.add(tag);
      }
      return next;
    });
  };

  const copySelected = async () => {
    const text = Array.from(selectedTags).join(" ");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageTransition>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Hash className="h-6 w-6 text-ig-pink" />
            Hashtag Explorer
          </h1>
          <p className="text-sm text-muted-foreground">
            Research and build optimized hashtag sets for your posts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Search */}
          <div className="space-y-4">
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Research Topic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. morning productivity routine, small business marketing tips..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button
                  onClick={handleResearch}
                  disabled={researching || !topic.trim()}
                  className="w-full"
                >
                  {researching ? (
                    <>Researching...</>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Research Hashtags
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Selected tags clipboard */}
            {selectedTags.size > 0 && (
              <Card className="border-border/40">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      Selected ({selectedTags.size}/30)
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copySelected}
                      className="h-7 text-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 mr-1" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" /> Copy All
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {Array.from(selectedTags).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        onClick={() => toggleTag(tag)}
                        className="cursor-pointer text-[10px] bg-ig-pink/10 border-ig-pink/30 text-ig-pink hover:bg-ig-pink/20"
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tip */}
            {result?.tip && (
              <Card className="border-border/40 border-amber-500/20 bg-amber-500/5">
                <CardContent className="py-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{result.tip}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Banned tags */}
            {result?.banned && result.banned.length > 0 && (
              <Card className="border-border/40 border-rose-500/20 bg-rose-500/5">
                <CardContent className="py-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-rose-500 mb-1">Avoid These Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {result.banned.map((tag) => (
                          <span key={tag} className="text-[10px] text-rose-400 line-through">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 space-y-4">
            {result ? (
              result.sets.map((set) => {
                const config = CATEGORY_CONFIG[set.category] || CATEGORY_CONFIG.Niche;
                const Icon = config.icon;
                return (
                  <Card key={set.category} className="border-border/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className={`h-6 w-6 rounded-md ${config.bgColor} flex items-center justify-center`}>
                          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                        </div>
                        {set.category}
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {set.tags.length} tags
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {set.tags.map((t) => {
                          const isSelected = selectedTags.has(t.tag);
                          return (
                            <button
                              key={t.tag}
                              onClick={() => toggleTag(t.tag)}
                              className={`flex items-center justify-between rounded-lg border p-2.5 text-left transition-all ${
                                isSelected
                                  ? "border-ig-pink/30 bg-ig-pink/5"
                                  : "border-border/40 hover:border-border"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`h-3 w-3 rounded-full border-2 transition-colors ${
                                  isSelected ? "border-ig-pink bg-ig-pink" : "border-muted-foreground/30"
                                }`} />
                                <span className="text-sm font-medium">{t.tag}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-[9px] ${REACH_COLORS[t.reach]}`}>
                                  {t.reach}
                                </Badge>
                                <span className={`text-[9px] ${COMPETITION_COLORS[t.competition]}`}>
                                  {t.competition === "low" ? "Low comp" : t.competition === "high" ? "High comp" : "Med comp"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-border/40">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Hash className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Enter a topic to research optimal hashtag sets
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    AI-powered research across branded, niche, reach, and trending categories
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
