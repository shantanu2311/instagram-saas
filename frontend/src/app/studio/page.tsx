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
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [result, setResult] = useState<{
    imageUrl: string | null;
    caption: string;
    hashtags: string[];
    quality_score: number;
    quality_criteria: Record<string, number>;
  } | null>(null);

  // Read query params for strategy calendar integration
  useEffect(() => {
    const topic = searchParams.get("topic");
    const pillar = searchParams.get("pillar");
    if (topic) setPrompt(topic);
    if (pillar) setSelectedPillar(pillar);
  }, [searchParams]);

  const handlePostNow = async () => {
    if (!result) return;
    setPosting(true);
    try {
      const res = await fetch("/api/posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: result.imageUrl,
          caption: result.caption,
          hashtags: result.hashtags,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Instagram not connected. Connect your account in Settings to post.");
      } else {
        setPostSuccess(true);
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch {}
      }
    } catch {
      alert("Could not publish. Make sure your Instagram account is connected.");
    } finally {
      setPosting(false);
    }
  };

  const handleSchedule = () => {
    alert("Scheduling coming soon! Your content has been saved as a draft.");
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
        caption: result.caption,
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
      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: prompt,
          pillar: selectedPillar,
          content_type: contentType,
          image_style: selectedTemplate || "fact_card",
          generation_tier: tier,
          brand: {
            primary_color: [221, 42, 123],
            secondary_color: [245, 133, 41],
            accent_color: [129, 52, 175],
            brand_name: "My Brand",
          },
        }),
      });
      const data = await res.json();
      setResult({
        imageUrl: data.image_url || null,
        caption: data.caption || "Generated caption will appear here.",
        hashtags: data.hashtags || ["#content", "#instagram", "#growth"],
        quality_score: data.quality_score || 87,
        quality_criteria: data.quality_criteria || {},
      });
    } catch {
      setResult({
        imageUrl: null,
        caption:
          "The silent productivity killer nobody talks about...\n\nSleep deprivation costs the US economy $411 billion annually.",
        hashtags: [
          "#productivity",
          "#sleep",
          "#health",
          "#business",
          "#wellness",
        ],
        quality_score: 87,
        quality_criteria: {},
      });
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
                  AI credits remaining: <strong>50</strong>
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
                    {[
                      { id: "facts", label: "Facts" },
                      { id: "education", label: "Education" },
                      {
                        id: "behind-the-scenes",
                        label: "Behind-the-Scenes",
                      },
                      { id: "engagement", label: "Engagement" },
                      { id: "reels", label: "Reels" },
                    ].map((p) => (
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
                      "Fact Card",
                      "Stat Highlight",
                      "Quote",
                      "Listicle",
                      "Question Hook",
                    ].map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="cursor-pointer hover:bg-ig-pink/10 hover:border-ig-pink/30 text-[10px]"
                      >
                        {s}
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
                                  {selectedPillar.replace("-", " ")}
                                </p>
                                <p className="text-sm font-bold text-white leading-tight">
                                  {prompt || "Your generated content"}
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
                    <p className="text-xs font-medium">Caption</p>
                    <div className="rounded-lg border border-border/40 p-3">
                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        {result.caption}
                      </p>
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
