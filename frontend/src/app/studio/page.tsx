"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wand2,
  Image as ImageIcon,
  Video,
  Layers,
  Sparkles,
  Zap,
  Send,
  Calendar,
  Repeat2,
  FileText,
  Mic,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  Music,
  Type,
  Camera,
  Play,
} from "lucide-react";
import { IPhoneMockup } from "@/components/landing/iphone-mockup";
import { TemplateGallery } from "@/components/studio/template-gallery";
import { GenerationProgress } from "@/components/studio/generation-progress";
import { QualityRing } from "@/components/studio/quality-ring";
import { PageTransition } from "@/components/page-transition";
import { DraftHistory } from "@/components/studio/draft-history";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { useBrand } from "@/lib/hooks/use-brand";
import { useQueueStore } from "@/lib/stores/queue-store";

function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

type ContentType = "image" | "carousel" | "reel";
type GenerationTier = "standard" | "ai-enhanced";
type StudioMode = "create" | "repurpose";
type SourceType = "blog" | "transcript" | "notes" | "other";

type ReelDuration = "15" | "30" | "60" | "90";

interface ReelScene {
  label: string;
  startSec: number;
  endSec: number;
  voiceover: string;
  onScreenText: string;
  visualDirection: string;
}

interface ReelScriptResult {
  hook: string;
  scenes: ReelScene[];
  caption: string;
  hashtags: string[];
  audioSuggestion: string;
  totalDuration: number;
  quality_score: number;
  quality_criteria: Record<string, number>;
}

interface RepurposeResult {
  reel: { hook: string; script: string; onScreenText: string[]; duration: string };
  carousel: { title: string; slides: string[] };
  caption: { headline: string; caption: string; hashtags: string[] };
  stories: Array<{ text: string; cta: string }>;
}

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioContent />
    </Suspense>
  );
}

function StudioContent() {
  const searchParams = useSearchParams();

  const [contentType, setContentType] = useState<ContentType>("image");
  const [tier, setTier] = useState<GenerationTier>("standard");
  const [prompt, setPrompt] = useState("");
  const [selectedPillar, setSelectedPillar] = useState("facts");
  const [selectedTemplate, setSelectedTemplate] = useState("fact_card");
  const [selectedStyle, setSelectedStyle] = useState("Fact Card");
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [editedCaption, setEditedCaption] = useState("");
  const [postError, setPostError] = useState<string | null>(null);
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);
  const [studioMode, setStudioMode] = useState<StudioMode>("create");
  const [sourceContent, setSourceContent] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("blog");
  const [repurposeResult, setRepurposeResult] = useState<RepurposeResult | null>(null);
  const [repurposeExpanded, setRepurposeExpanded] = useState<string | null>(null);
  const [reelDuration, setReelDuration] = useState<ReelDuration>("30");
  const [facelessMode, setFacelessMode] = useState(false);
  const [reelScript, setReelScript] = useState<ReelScriptResult | null>(null);
  const [activeScene, setActiveScene] = useState<number | null>(null);
  const [slideCount, setSlideCount] = useState(5);
  const [carouselSlides, setCarouselSlides] = useState<Array<{ headline: string; body: string }>>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const { strategy } = useStrategyStore();
  const { brand: savedBrand } = useBrand();
  const [result, setResult] = useState<{
    imageUrl: string | null;
    headline: string;
    caption: string;
    hashtags: string[];
    quality_score: number;
    quality_criteria: Record<string, number>;
  } | null>(null);

  const pillars = strategy?.contentPillars?.length
    ? strategy.contentPillars.map((p) => ({
        id: p.name.toLowerCase().replace(/\s+/g, "-"),
        label: p.name,
      }))
    : [
        { id: "facts", label: "Facts" },
        { id: "education", label: "Education" },
        { id: "behind-the-scenes", label: "Behind-the-Scenes" },
        { id: "engagement", label: "Engagement" },
        { id: "reels", label: "Reels" },
      ];

  // Read query params for strategy calendar integration + queue replacement
  const replaceId = searchParams.get("replaceId");
  useEffect(() => {
    const topic = searchParams.get("topic");
    const pillar = searchParams.get("pillar");
    if (topic) setPrompt(topic);
    if (pillar) setSelectedPillar(pillar);
  }, [searchParams]);

  const handlePostNow = async () => {
    if (!result) return;
    setPostError(null);
    setPosting(true);
    try {
      const res = await fetch("/api/posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: result.imageUrl,
          caption: editedCaption || result.caption,
          hashtags: result.hashtags,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setPostError("Connect your Instagram account in Settings to post.");
      } else {
        setPostSuccess(true);
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch {}
      }
    } catch {
      setPostError("Could not publish. Make sure your Instagram account is connected.");
    } finally {
      setPosting(false);
    }
  };

  const handleSchedule = () => {
    setScheduleMsg("Scheduling coming soon! Your content has been saved as a draft.");
  };

  const handleSaveDraft = async () => {
    if (!result) return;
    await fetch("/api/studio/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType,
        generationTier: tier,
        prompt,
        caption: editedCaption || result.caption,
        hashtags: result.hashtags,
        mediaUrls: result.imageUrl ? [result.imageUrl] : [],
        qualityScore: result.quality_score,
        status: "draft",
      }),
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Build full context for AI generation
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

      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: prompt,
          pillar: selectedPillar,
          content_type: contentType,
          image_style: selectedTemplate || "fact_card",
          generation_tier: tier,
          niche: savedBrand.niche,
          brand_voice: savedBrand.voiceDescription,
          sample_captions: savedBrand.sampleCaption?.split("\n---\n").filter(Boolean) ?? [],
          tone_formality: savedBrand.toneFormality,
          tone_humor: savedBrand.toneHumor,
          content_pillars: savedBrand.contentPillars,
          brand_hashtag: savedBrand.brandHashtag,
          brand: {
            primary_color: hexToRgb(savedBrand.primaryColor) || [221, 42, 123],
            secondary_color: hexToRgb(savedBrand.secondaryColor) || [245, 133, 41],
            accent_color: hexToRgb(savedBrand.accentColor) || [129, 52, 175],
            brand_name: savedBrand.brandHashtag?.replace("#", "") || "My Brand",
          },
          strategy: strategyContext,
          ...(contentType === "carousel" ? { slide_count: slideCount } : {}),
        }),
      });
      const data = await res.json();
      if (contentType === "carousel" && data.slides) {
        setCarouselSlides(data.slides);
        setActiveSlideIndex(0);
      }
      const captionText = data.caption || "Generated caption will appear here.";
      setResult({
        imageUrl: data.image_url || null,
        headline: data.headline || captionText.split("\n")[0].slice(0, 60),
        caption: captionText,
        hashtags: data.hashtags || ["#content", "#instagram", "#growth"],
        quality_score: data.quality_score || 82,
        quality_criteria: data.quality_criteria || {},
      });
      setEditedCaption(captionText);
    } catch {
      setResult({
        imageUrl: null,
        headline: prompt.slice(0, 60),
        caption: `Let's talk about ${prompt.toLowerCase()}...\n\nThis is something worth understanding.`,
        hashtags: [`#${selectedPillar}`, "#instagram", "#content"],
        quality_score: 70,
        quality_criteria: {},
      });
      setEditedCaption(`Let's talk about ${prompt.toLowerCase()}...\n\nThis is something worth understanding.`);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateReel = async () => {
    setGenerating(true);
    setReelScript(null);
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

      const res = await fetch("/api/studio/generate-reel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: prompt,
          pillar: selectedPillar,
          duration: reelDuration,
          faceless: facelessMode,
          niche: savedBrand.niche,
          brand_name: savedBrand.brandHashtag?.replace("#", "") || "",
          brand_voice: savedBrand.voiceDescription,
          sample_captions: savedBrand.sampleCaption?.split("\n---\n").filter(Boolean) ?? [],
          tone_formality: savedBrand.toneFormality,
          tone_humor: savedBrand.toneHumor,
          content_pillars: savedBrand.contentPillars,
          brand_hashtag: savedBrand.brandHashtag,
          strategy: strategyContext,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReelScript(data);
      setActiveScene(0);
    } catch (err) {
      console.error("Reel generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRepurpose = async () => {
    setGenerating(true);
    setRepurposeResult(null);
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

      const res = await fetch("/api/studio/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_content: sourceContent,
          source_type: sourceType,
          niche: savedBrand.niche,
          brand_name: savedBrand.brandHashtag?.replace("#", "") || "",
          brand_voice: savedBrand.voiceDescription,
          sample_captions: savedBrand.sampleCaption?.split("\n---\n").filter(Boolean) ?? [],
          tone_formality: savedBrand.toneFormality,
          tone_humor: savedBrand.toneHumor,
          content_pillars: savedBrand.contentPillars,
          brand_hashtag: savedBrand.brandHashtag,
          strategy: strategyContext,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRepurposeResult(data);
      setRepurposeExpanded("reel");
    } catch (err) {
      console.error("Repurpose error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageTransition>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Studio</h1>
          <p className="text-sm text-muted-foreground">
            {studioMode === "create"
              ? "Generate branded Instagram content with AI."
              : "Turn long-form content into multiple Instagram formats."}
          </p>
        </div>
        <div className="flex rounded-lg border border-border/40 overflow-hidden">
          <button
            onClick={() => setStudioMode("create")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              studioMode === "create"
                ? "bg-ig-pink/10 text-ig-pink"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            Create
          </button>
          <button
            onClick={() => setStudioMode("repurpose")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              studioMode === "repurpose"
                ? "bg-ig-orange/10 text-ig-orange"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Repeat2 className="h-3.5 w-3.5" />
            Repurpose
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel: Controls */}
        <div className="lg:col-span-2 space-y-4">

        {studioMode === "repurpose" ? (
          <>
          {/* Repurpose mode */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Repeat2 className="h-4 w-4 text-ig-orange" />
                Source Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-4 gap-1.5">
                {([
                  { type: "blog" as const, label: "Blog", icon: FileText },
                  { type: "transcript" as const, label: "Transcript", icon: Mic },
                  { type: "notes" as const, label: "Notes", icon: StickyNote },
                  { type: "other" as const, label: "Other", icon: Layers },
                ] as const).map((s) => (
                  <button
                    key={s.type}
                    onClick={() => setSourceType(s.type)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all text-center ${
                      sourceType === s.type
                        ? "border-ig-orange bg-ig-orange/10"
                        : "border-border/40 hover:border-ig-orange/30"
                    }`}
                  >
                    <s.icon className={`h-4 w-4 ${sourceType === s.type ? "text-ig-orange" : "text-muted-foreground"}`} />
                    <span className="text-[10px] font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
              <textarea
                value={sourceContent}
                onChange={(e) => setSourceContent(e.target.value)}
                placeholder={
                  sourceType === "blog"
                    ? "Paste your blog post or article here..."
                    : sourceType === "transcript"
                    ? "Paste your video or podcast transcript here..."
                    : sourceType === "notes"
                    ? "Paste your notes, bullet points, or ideas here..."
                    : "Paste any long-form content to repurpose..."
                }
                rows={10}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {sourceContent.length.toLocaleString()} / 5,000 chars
                </span>
              </div>
              <Button
                onClick={handleRepurpose}
                disabled={generating || !sourceContent.trim()}
                className="w-full bg-ig-orange hover:bg-ig-orange/90"
              >
                {generating ? (
                  <>Repurposing...</>
                ) : (
                  <>
                    <Repeat2 className="h-4 w-4 mr-2" />
                    Repurpose into 4 Formats
                  </>
                )}
              </Button>
              <GenerationProgress isGenerating={generating} />
            </CardContent>
          </Card>
          </>
        ) : (
          <>
          {/* Create mode — Template gallery */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Template</CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateGallery
                selected={selectedTemplate}
                onSelect={setSelectedTemplate}
              />
            </CardContent>
          </Card>

          {/* Content type */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Content Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: "image" as const, label: "Image", icon: ImageIcon },
                  {
                    type: "carousel" as const,
                    label: "Carousel",
                    icon: Layers,
                  },
                  { type: "reel" as const, label: "Reel", icon: Video },
                ].map((ct) => (
                  <button
                    key={ct.type}
                    onClick={() => setContentType(ct.type)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${
                      contentType === ct.type
                        ? "border-ig-pink bg-ig-pink/10"
                        : "border-border/40 hover:border-ig-pink/30"
                    }`}
                  >
                    <ct.icon
                      className={`h-5 w-5 ${
                        contentType === ct.type
                          ? "text-ig-pink"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-xs font-medium">{ct.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Carousel settings */}
          {contentType === "carousel" && (
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-ig-pink" />
                  Carousel Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium mb-2">Number of Slides</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSlideCount(Math.max(2, slideCount - 1))}
                      disabled={slideCount <= 2}
                      className="h-8 w-8 rounded-lg border border-border/40 flex items-center justify-center text-sm font-medium hover:bg-muted/60 disabled:opacity-40"
                    >
                      &minus;
                    </button>
                    <span className="text-lg font-semibold w-8 text-center">{slideCount}</span>
                    <button
                      onClick={() => setSlideCount(Math.min(10, slideCount + 1))}
                      disabled={slideCount >= 10}
                      className="h-8 w-8 rounded-lg border border-border/40 flex items-center justify-center text-sm font-medium hover:bg-muted/60 disabled:opacity-40"
                    >
                      +
                    </button>
                    <span className="text-[10px] text-muted-foreground">2-10 slides</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generation tier */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Generation Tier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTier("standard")}
                  className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-all ${
                    tier === "standard"
                      ? "border-ig-pink bg-ig-pink/10"
                      : "border-border/40 hover:border-ig-pink/30"
                  }`}
                >
                  <Zap className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">Standard</p>
                    <p className="text-[10px] text-muted-foreground">
                      Built-in engine. Free.
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setTier("ai-enhanced")}
                  className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-all ${
                    tier === "ai-enhanced"
                      ? "border-ig-pink bg-ig-pink/10"
                      : "border-border/40 hover:border-ig-pink/30"
                  }`}
                >
                  <Sparkles className="h-4 w-4 text-ig-pink mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">AI-Enhanced</p>
                    <p className="text-[10px] text-muted-foreground">
                      {contentType === "reel" ? "5 credits" : "1 credit"}
                    </p>
                  </div>
                </button>
              </div>
              {tier === "ai-enhanced" && (
                <p className="text-[11px] text-muted-foreground">
                  Upgrade to Pro for AI credits.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Reel-specific controls */}
          {contentType === "reel" && (
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Video className="h-4 w-4 text-ig-pink" />
                  Reel Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium mb-2">Duration</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([
                      { value: "15" as const, label: "15s", desc: "Quick" },
                      { value: "30" as const, label: "30s", desc: "Standard" },
                      { value: "60" as const, label: "60s", desc: "Teaching" },
                      { value: "90" as const, label: "90s", desc: "Deep" },
                    ]).map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setReelDuration(d.value)}
                        className={`flex flex-col items-center gap-0.5 rounded-lg border p-2 transition-all ${
                          reelDuration === d.value
                            ? "border-ig-pink bg-ig-pink/10"
                            : "border-border/40 hover:border-ig-pink/30"
                        }`}
                      >
                        <Clock className={`h-3.5 w-3.5 ${reelDuration === d.value ? "text-ig-pink" : "text-muted-foreground"}`} />
                        <span className="text-xs font-medium">{d.label}</span>
                        <span className="text-[9px] text-muted-foreground">{d.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setFacelessMode(!facelessMode)}
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 transition-all ${
                    facelessMode
                      ? "border-ig-pink bg-ig-pink/10"
                      : "border-border/40 hover:border-ig-pink/30"
                  }`}
                >
                  {facelessMode ? (
                    <EyeOff className="h-4 w-4 text-ig-pink" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="text-left">
                    <p className="text-xs font-medium">
                      {facelessMode ? "Faceless Mode ON" : "Faceless Mode OFF"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {facelessMode
                        ? "Text overlays, b-roll, screen recordings only"
                        : "Talking head + b-roll mix"}
                    </p>
                  </div>
                </button>
              </CardContent>
            </Card>
          )}

          {/* Prompt */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {contentType === "reel" ? "What's your Reel about?" : "What should this post be about?"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  contentType === "reel"
                    ? "e.g. 3 morning habits that 10x your productivity..."
                    : "e.g. A surprising statistic about sleep deprivation and productivity..."
                }
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />

              <div className="flex flex-wrap gap-1.5">
                {pillars.map((p) => (
                  <Badge
                    key={p.id}
                    variant="outline"
                    onClick={() => setSelectedPillar(p.id)}
                    className={`cursor-pointer text-[10px] ${
                      selectedPillar === p.id
                        ? "bg-ig-pink/10 border-ig-pink/30 text-ig-pink"
                        : "hover:bg-ig-pink/10 hover:border-ig-pink/30"
                    }`}
                  >
                    {p.label}
                  </Badge>
                ))}
              </div>

              {contentType !== "reel" && (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Fact Card", style: "fact_card" },
                    { label: "Stat Highlight", style: "stat_highlight" },
                    { label: "Quote", style: "quote" },
                    { label: "Listicle", style: "listicle" },
                    { label: "Question Hook", style: "question_hook" },
                  ].map((s) => (
                    <Badge
                      key={s.style}
                      variant="outline"
                      onClick={() => {
                        setSelectedStyle(s.label);
                        setSelectedTemplate(s.style);
                      }}
                      className={`cursor-pointer text-[10px] ${
                        selectedStyle === s.label
                          ? "bg-ig-pink/10 border-ig-pink/30 text-ig-pink"
                          : "hover:bg-ig-pink/10 hover:border-ig-pink/30"
                      }`}
                    >
                      {s.label}
                    </Badge>
                  ))}
                </div>
              )}

              <Button
                onClick={contentType === "reel" ? handleGenerateReel : handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full"
              >
                {generating ? (
                  <>Generating...</>
                ) : (
                  <>
                    {contentType === "reel" ? <Video className="h-4 w-4 mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                    {contentType === "reel" ? `Generate ${reelDuration}s Reel Script` : `Generate ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`}
                  </>
                )}
              </Button>

              {/* Generation progress */}
              <GenerationProgress isGenerating={generating} />
            </CardContent>
          </Card>
          </>
        )}
        </div>

        {/* Right panel: Preview */}
        <div className="lg:col-span-3 space-y-4">

        {studioMode === "repurpose" && repurposeResult ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Repeat2 className="h-4 w-4 text-ig-orange" />
              4 Formats Generated
            </h3>

            {/* Reel Script */}
            <Card className="border-border/40 overflow-hidden">
              <button
                onClick={() => setRepurposeExpanded(repurposeExpanded === "reel" ? null : "reel")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-ig-pink" />
                  <span className="text-sm font-medium">Reel Script</span>
                  <Badge variant="outline" className="text-[10px]">{repurposeResult.reel.duration}</Badge>
                </div>
                {repurposeExpanded === "reel" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {repurposeExpanded === "reel" && (
                <CardContent className="pt-0 space-y-3 border-t border-border/40">
                  <div className="mt-3">
                    <p className="text-xs font-medium text-ig-pink mb-1">Hook</p>
                    <p className="text-sm bg-ig-pink/5 rounded-lg p-3">{repurposeResult.reel.hook}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1">Script</p>
                    <pre className="text-sm bg-muted/30 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed">{repurposeResult.reel.script}</pre>
                  </div>
                  {repurposeResult.reel.onScreenText.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">On-Screen Text</p>
                      <div className="space-y-1">
                        {repurposeResult.reel.onScreenText.map((t, i) => (
                          <div key={i} className="text-xs bg-muted/30 rounded px-2 py-1.5 flex items-center gap-2">
                            <span className="text-muted-foreground font-mono">{i + 1}.</span> {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Carousel */}
            <Card className="border-border/40 overflow-hidden">
              <button
                onClick={() => setRepurposeExpanded(repurposeExpanded === "carousel" ? null : "carousel")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium">Carousel</span>
                  <Badge variant="outline" className="text-[10px]">{repurposeResult.carousel.slides.length} slides</Badge>
                </div>
                {repurposeExpanded === "carousel" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {repurposeExpanded === "carousel" && (
                <CardContent className="pt-0 space-y-3 border-t border-border/40">
                  <div className="mt-3">
                    <p className="text-xs font-medium text-indigo-500 mb-1">Cover Slide</p>
                    <p className="text-sm font-semibold bg-indigo-500/5 rounded-lg p-3">{repurposeResult.carousel.title}</p>
                  </div>
                  <div className="grid gap-2">
                    {repurposeResult.carousel.slides.map((slide, i) => (
                      <div key={i} className="text-sm bg-muted/30 rounded-lg p-3 flex gap-2">
                        <span className="text-muted-foreground font-mono text-xs shrink-0">{i + 1}.</span>
                        <span>{slide}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Caption Post */}
            <Card className="border-border/40 overflow-hidden">
              <button
                onClick={() => setRepurposeExpanded(repurposeExpanded === "caption" ? null : "caption")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Image Caption</span>
                </div>
                {repurposeExpanded === "caption" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {repurposeExpanded === "caption" && (
                <CardContent className="pt-0 space-y-3 border-t border-border/40">
                  <div className="mt-3">
                    <p className="text-xs font-medium text-emerald-500 mb-1">Headline</p>
                    <p className="text-sm font-semibold">{repurposeResult.caption.headline}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1">Caption</p>
                    <p className="text-sm bg-muted/30 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">{repurposeResult.caption.caption}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {repurposeResult.caption.hashtags.map((tag) => (
                      <span key={tag} className="text-[10px] text-ig-pink">{tag}</span>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Stories */}
            <Card className="border-border/40 overflow-hidden">
              <button
                onClick={() => setRepurposeExpanded(repurposeExpanded === "stories" ? null : "stories")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Stories</span>
                  <Badge variant="outline" className="text-[10px]">{repurposeResult.stories.length} slides</Badge>
                </div>
                {repurposeExpanded === "stories" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {repurposeExpanded === "stories" && (
                <CardContent className="pt-0 space-y-2 border-t border-border/40">
                  {repurposeResult.stories.map((story, i) => (
                    <div key={i} className="mt-3 bg-muted/30 rounded-lg p-3 space-y-1.5">
                      <p className="text-sm">{story.text}</p>
                      <p className="text-[10px] text-amber-500 font-medium">{story.cta}</p>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          </div>
        ) : studioMode === "repurpose" ? (
          <Card className="border-border/40">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Repeat2 className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">
                Paste content and click Repurpose to generate 4 Instagram formats
              </p>
            </CardContent>
          </Card>
        ) : contentType === "reel" && reelScript ? (
          /* Reel Script Editor View */
          <div className="space-y-4">
            {/* Script header with quality */}
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Video className="h-4 w-4 text-ig-pink" />
                    Reel Script — {reelScript.totalDuration}s
                    {facelessMode && (
                      <Badge variant="outline" className="text-[10px] border-ig-pink/30 text-ig-pink">
                        <EyeOff className="h-3 w-3 mr-1" /> Faceless
                      </Badge>
                    )}
                  </CardTitle>
                  <QualityRing score={reelScript.quality_score} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Hook highlight */}
                <div className="bg-ig-pink/5 border border-ig-pink/20 rounded-lg p-3 mb-3">
                  <p className="text-[10px] font-medium text-ig-pink uppercase tracking-wider mb-1">Hook (0-3s)</p>
                  <p className="text-sm font-semibold">{reelScript.hook}</p>
                </div>

                {/* Audio suggestion */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                  <Music className="h-3.5 w-3.5 shrink-0" />
                  <span>{reelScript.audioSuggestion}</span>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Scene Timeline</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Visual timeline bar */}
                <div className="flex rounded-full overflow-hidden h-2 mb-4 bg-muted/30">
                  {reelScript.scenes.map((scene, i) => {
                    const width = ((scene.endSec - scene.startSec) / reelScript.totalDuration) * 100;
                    const colors = [
                      "bg-ig-pink",
                      "bg-rose-400",
                      "bg-ig-orange",
                      "bg-amber-400",
                      "bg-emerald-400",
                      "bg-indigo-400",
                    ];
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveScene(activeScene === i ? null : i)}
                        className={`${colors[i % colors.length]} transition-opacity ${
                          activeScene !== null && activeScene !== i ? "opacity-30" : "opacity-100"
                        }`}
                        style={{ width: `${width}%` }}
                        title={`${scene.label} (${scene.startSec}-${scene.endSec}s)`}
                      />
                    );
                  })}
                </div>

                {/* Scene cards */}
                <div className="space-y-2">
                  {reelScript.scenes.map((scene, i) => {
                    const isActive = activeScene === i;
                    const colors = [
                      "border-ig-pink/30 bg-ig-pink/5",
                      "border-rose-400/30 bg-rose-400/5",
                      "border-ig-orange/30 bg-ig-orange/5",
                      "border-amber-400/30 bg-amber-400/5",
                      "border-emerald-400/30 bg-emerald-400/5",
                      "border-indigo-400/30 bg-indigo-400/5",
                    ];
                    const dotColors = [
                      "bg-ig-pink",
                      "bg-rose-400",
                      "bg-ig-orange",
                      "bg-amber-400",
                      "bg-emerald-400",
                      "bg-indigo-400",
                    ];

                    return (
                      <button
                        key={i}
                        onClick={() => setActiveScene(isActive ? null : i)}
                        className={`w-full text-left rounded-lg border p-3 transition-all ${
                          isActive ? colors[i % colors.length] : "border-border/40 hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${dotColors[i % dotColors.length]}`} />
                            <span className="text-xs font-semibold">{scene.label}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {scene.startSec}s — {scene.endSec}s
                          </span>
                        </div>

                        {isActive && (
                          <div className="mt-2 space-y-2 pl-4">
                            <div className="flex items-start gap-2">
                              <Mic className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Voiceover</p>
                                <p className="text-sm leading-relaxed">{scene.voiceover}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Type className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">On-Screen Text</p>
                                <p className="text-sm font-medium">{scene.onScreenText}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Camera className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Visual</p>
                                <p className="text-xs text-muted-foreground italic">{scene.visualDirection}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Caption + Hashtags */}
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Reel Caption</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="rounded-lg border border-border/40 p-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{reelScript.caption}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {reelScript.hashtags.map((tag) => (
                    <span key={tag} className="text-[10px] text-ig-pink">{tag}</span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border/40">
                  <Button size="sm" className="flex-1" onClick={handlePostNow} disabled={posting}>
                    {posting ? "Publishing..." : <>
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Post
                    </>}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={handleSchedule}>
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    Schedule
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleSaveDraft}>
                    Save Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : contentType === "reel" && !reelScript ? (
          <Card className="border-border/40">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Play className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">
                Set your Reel topic and click Generate to create a timed script
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Includes voiceover, on-screen text, and visual direction for each scene
              </p>
            </CardContent>
          </Card>
        ) : contentType === "carousel" && carouselSlides.length > 0 && result ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-ig-pink" />
                Carousel Preview
              </h3>
              <QualityRing score={result.quality_score} />
            </div>
            <IPhoneMockup className="w-full max-w-[280px] mx-auto">
              <div className="h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex flex-col">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10">
                  <div className="h-5 w-5 rounded-full ig-gradient" />
                  <span className="text-white text-[10px] font-medium">
                    {savedBrand.brandHashtag?.replace("#", "") || "yourbrand"}
                  </span>
                </div>
                <div
                  className="flex-1 flex flex-col items-center justify-center p-5 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${savedBrand.primaryColor}, ${savedBrand.secondaryColor})`,
                  }}
                >
                  {activeSlideIndex === 0 ? (
                    <p className="text-sm font-bold text-white leading-tight">
                      {result.headline}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] font-medium text-white/60">
                        {String(activeSlideIndex).padStart(2, "0")}
                      </p>
                      <p className="text-xs font-bold text-white leading-tight">
                        {carouselSlides[activeSlideIndex - 1]?.headline}
                      </p>
                      <p className="text-[10px] text-white/80 leading-relaxed">
                        {carouselSlides[activeSlideIndex - 1]?.body}
                      </p>
                    </div>
                  )}
                </div>
                <div className="px-3 py-2 flex items-center justify-center gap-1">
                  {Array.from({ length: carouselSlides.length + 1 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeSlideIndex ? "w-4 bg-ig-pink" : "w-1.5 bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </IPhoneMockup>
            {/* Navigation arrows */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                disabled={activeSlideIndex === 0}
                className="h-8 w-8 rounded-full border border-border/40 flex items-center justify-center hover:bg-muted/60 disabled:opacity-30"
              >
                &larr;
              </button>
              <span className="text-xs text-muted-foreground">
                {activeSlideIndex + 1} / {carouselSlides.length + 1}
              </span>
              <button
                onClick={() => setActiveSlideIndex(Math.min(carouselSlides.length, activeSlideIndex + 1))}
                disabled={activeSlideIndex >= carouselSlides.length}
                className="h-8 w-8 rounded-full border border-border/40 flex items-center justify-center hover:bg-muted/60 disabled:opacity-30"
              >
                &rarr;
              </button>
            </div>
            {/* Editable slides list */}
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Edit Slides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {carouselSlides.map((slide, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveSlideIndex(i + 1)}
                    className={`rounded-lg border p-3 space-y-1.5 cursor-pointer transition-all ${
                      activeSlideIndex === i + 1 ? "border-ig-pink bg-ig-pink/5" : "border-border/40 hover:border-ig-pink/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Slide {i + 1}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={slide.headline}
                      onChange={(e) => {
                        const updated = [...carouselSlides];
                        updated[i] = { ...updated[i], headline: e.target.value };
                        setCarouselSlides(updated);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-xs font-semibold bg-transparent border-none outline-none"
                      placeholder="Slide headline..."
                    />
                    <input
                      type="text"
                      value={slide.body}
                      onChange={(e) => {
                        const updated = [...carouselSlides];
                        updated[i] = { ...updated[i], body: e.target.value };
                        setCarouselSlides(updated);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-[11px] text-muted-foreground bg-transparent border-none outline-none"
                      placeholder="Slide body text..."
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Caption */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Caption</p>
                <span className="text-[10px] text-muted-foreground">
                  {editedCaption.length} / 2,200
                </span>
              </div>
              <div className="rounded-lg border border-border/40 p-3">
                <textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  className="w-full text-sm leading-relaxed bg-transparent border-0 resize-none focus:outline-none focus:ring-0 min-h-[80px]"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {result.hashtags.join(" ")}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handlePostNow} disabled={posting}>
                {posting ? "Publishing..." : postSuccess ? "Posted!" : <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Now
                </>}
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleSchedule}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleSaveDraft}>
                Save Draft
              </Button>
            </div>
          </div>
        ) : (
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Preview</CardTitle>
                {result && <QualityRing score={result.quality_score} />}
              </div>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  {/* iPhone mockup preview */}
                  <div className="flex justify-center">
                    <IPhoneMockup className="w-[260px]">
                      <div className="h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex flex-col">
                        {/* Mock IG header */}
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
                          <div className="h-6 w-6 rounded-full ig-gradient" />
                          <span className="text-white text-xs font-medium">
                            yourbrand
                          </span>
                        </div>
                        {/* Post image */}
                        <div className="flex-1 relative overflow-hidden">
                          {result?.imageUrl ? (
                            <img
                              src={result.imageUrl}
                              alt="Generated content"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-rose-950 to-pink-900 flex items-center justify-center p-4">
                              <div className="text-center space-y-2">
                                <p className="text-[9px] uppercase tracking-[0.2em] text-pink-300">
                                  {selectedPillar.replace(/-/g, " ")}
                                </p>
                                <p className="text-sm font-bold text-white leading-tight">
                                  {result?.headline || "Your generated content"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Mock engagement bar */}
                        <div className="px-3 py-2 space-y-1">
                          <div className="flex gap-3">
                            <div className="h-3.5 w-3.5 rounded-full border border-white/30" />
                            <div className="h-3.5 w-3.5 rounded-full border border-white/30" />
                            <div className="h-3.5 w-3.5 rounded-full border border-white/30" />
                          </div>
                          <div className="h-2 w-16 rounded bg-white/20" />
                        </div>
                      </div>
                    </IPhoneMockup>
                  </div>

                  {/* Caption */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">Caption</p>
                      <span className="text-[10px] text-muted-foreground">
                        {editedCaption.length} / 2,200
                      </span>
                    </div>
                    <div className="rounded-lg border border-border/40 p-3">
                      <textarea
                        value={editedCaption}
                        onChange={(e) => setEditedCaption(e.target.value)}
                        className="w-full text-sm leading-relaxed bg-transparent border-0 resize-none focus:outline-none focus:ring-0 min-h-[80px]"
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {result.hashtags.join(" ")}
                      </p>
                    </div>
                  </div>

                  {/* Inline feedback banners */}
                  {postError && (
                    <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-center">
                      {postError}
                    </div>
                  )}
                  {scheduleMsg && (
                    <div className="text-sm text-ig-orange bg-ig-orange/10 rounded-lg px-3 py-2 text-center">
                      {scheduleMsg}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handlePostNow} disabled={posting}>
                      {posting ? "Publishing..." : postSuccess ? "Posted!" : <>
                        <Send className="h-4 w-4 mr-2" />
                        Post Now
                      </>}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleSchedule}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                  <div className="flex justify-end gap-2">
                    {replaceId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-ig-orange border-ig-orange/30 hover:bg-ig-orange/10"
                        onClick={() => {
                          // Replace the queue item with this generated content
                          useQueueStore.getState().updateItem(replaceId, {
                            headline: result.headline,
                            caption: editedCaption || result.caption,
                            hashtags: result.hashtags,
                            qualityScore: result.quality_score,
                            status: "pending_approval",
                          });
                          window.location.href = "/queue";
                        }}
                      >
                        Replace in Queue
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleSaveDraft}>
                      Save Draft
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <IPhoneMockup className="w-[260px]">
                    <div className="h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
                      <div className="text-center space-y-2 px-6">
                        <Wand2 className="h-8 w-8 text-white/20 mx-auto" />
                        <p className="text-xs text-white/30">
                          Generated content will appear here
                        </p>
                      </div>
                    </div>
                  </IPhoneMockup>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* Draft history */}
      <DraftHistory
        onLoad={(draft) => {
          setPrompt(draft.caption);
          setSelectedPillar(draft.pillar);
        }}
      />
    </div>
    </PageTransition>
  );
}
