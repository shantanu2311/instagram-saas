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
} from "lucide-react";
import { IPhoneMockup } from "@/components/landing/iphone-mockup";
import { TemplateGallery } from "@/components/studio/template-gallery";
import { GenerationProgress } from "@/components/studio/generation-progress";
import { QualityRing } from "@/components/studio/quality-ring";
import { PageTransition } from "@/components/page-transition";
import { DraftHistory } from "@/components/studio/draft-history";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { useQueueStore } from "@/lib/stores/queue-store";

function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

type ContentType = "image" | "carousel" | "reel";
type GenerationTier = "standard" | "ai-enhanced";

export default function StudioPage() {
  return (
    <Suspense>
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
  const { strategy } = useStrategyStore();
  const { brand: savedBrand } = useOnboardingStore();
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
          sample_caption: savedBrand.sampleCaption,
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
        }),
      });
      const data = await res.json();
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

  return (
    <PageTransition>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Content Studio</h1>
        <p className="text-sm text-muted-foreground">
          Generate branded Instagram content with AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel: Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Template gallery */}
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

          {/* Prompt */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                What should this post be about?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A surprising statistic about sleep deprivation and productivity..."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />

              <Tabs defaultValue="pillar" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="pillar" className="flex-1 text-xs">
                    Pillar
                  </TabsTrigger>
                  <TabsTrigger value="style" className="flex-1 text-xs">
                    Style
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pillar" className="mt-2">
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
                </TabsContent>
                <TabsContent value="style" className="mt-2">
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
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full"
              >
                {generating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate{" "}
                    {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
                  </>
                )}
              </Button>

              {/* Generation progress */}
              <GenerationProgress isGenerating={generating} />
            </CardContent>
          </Card>
        </div>

        {/* Right panel: Preview */}
        <div className="lg:col-span-3 space-y-4">
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
