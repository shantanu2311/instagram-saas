"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/page-transition";
import { IPhoneMockup } from "@/components/landing/iphone-mockup";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { useQueueStore } from "@/lib/stores/queue-store";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Palette,
  Type,
  Layout,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface SamplePost {
  headline: string;
  caption: string;
  hashtags: string[];
  pillar: string;
  contentType: string;
  qualityScore: number;
}

export default function DesignPreviewPage() {
  const router = useRouter();
  const { strategy, calendar } = useStrategyStore();
  const { brand: savedBrand } = useOnboardingStore();
  const [samples, setSamples] = useState<SamplePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!strategy) {
      router.push("/strategy");
      return;
    }
    generateSamples();
  }, [strategy]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateSamples = async () => {
    setLoading(true);
    try {
      // Pick 3 diverse slots from the calendar (or strategy pillars)
      const pillars = strategy?.contentPillars?.slice(0, 3) || [];
      const types: Array<"image" | "carousel" | "reel"> = ["image", "carousel", "reel"];

      const samplePromises = pillars.map((pillar, i) =>
        fetch("/api/studio/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: pillar.examples?.[0] || `${pillar.name} content`,
            pillar: pillar.name.toLowerCase(),
            content_type: types[i % types.length],
            image_style: "fact_card",
            niche: savedBrand.niche,
            brand_voice: savedBrand.voiceDescription,
            tone_formality: savedBrand.toneFormality,
            tone_humor: savedBrand.toneHumor,
            content_pillars: savedBrand.contentPillars,
            brand_hashtag: savedBrand.brandHashtag,
            brand: {
              brand_name: savedBrand.brandHashtag?.replace("#", "") || "",
            },
            strategy: {
              contentPillars: strategy?.contentPillars,
              toneAndVoice: strategy?.toneAndVoice,
              hashtagStrategy: strategy?.hashtagStrategy,
              brandPositioning: strategy?.brandPositioning,
            },
          }),
        }).then((r) => r.json())
      );

      const results = await Promise.all(samplePromises);
      setSamples(
        results.map((r, i) => ({
          headline: r.headline || pillars[i]?.name || "Sample",
          caption: r.caption || "",
          hashtags: r.hashtags || [],
          pillar: pillars[i]?.name || "General",
          contentType: types[i % types.length],
          qualityScore: r.quality_score || 80,
        }))
      );
    } catch {
      // Fallback samples
      setSamples([
        {
          headline: "Sample post preview",
          caption: "This is what your posts will look like...",
          hashtags: ["#sample"],
          pillar: "Education",
          contentType: "image",
          qualityScore: 80,
        },
      ]);
    }
    setLoading(false);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    await generateSamples();
    setRegenerating(false);
  };

  const handleApproveDesign = async () => {
    setApproved(true);
    const queueStore = useQueueStore.getState();

    // Get calendar slots
    const slots = calendar?.slots || [];
    if (slots.length === 0) {
      router.push("/queue");
      return;
    }

    // Build context
    const brandContext = {
      niche: savedBrand.niche,
      brandName: savedBrand.brandHashtag?.replace("#", "") || "",
      primaryColor: savedBrand.primaryColor,
      secondaryColor: savedBrand.secondaryColor,
      accentColor: savedBrand.accentColor,
      toneFormality: savedBrand.toneFormality,
      toneHumor: savedBrand.toneHumor,
      voiceDescription: savedBrand.voiceDescription,
      sampleCaptions: savedBrand.sampleCaptions?.filter((c: string) => c.trim()) || [],
      contentPillars: savedBrand.contentPillars,
      brandHashtag: savedBrand.brandHashtag,
    };

    const strategyContext = {
      contentPillars: strategy?.contentPillars,
      toneAndVoice: strategy?.toneAndVoice,
      hashtagStrategy: strategy?.hashtagStrategy,
      brandPositioning: strategy?.brandPositioning,
    };

    // Add placeholder queue items
    for (const slot of slots) {
      queueStore.addItem({
        id: `q-${slot.date}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        calendarSlotDate: slot.date,
        pillar: slot.pillar,
        contentType: (slot.contentType || "image") as "image" | "carousel" | "reel",
        topic: slot.topic,
        headline: slot.headline || slot.topic,
        caption: "",
        hashtags: [],
        qualityScore: 0,
        suggestedTime: slot.suggestedTime || "7:30 AM",
        status: "generating",
        createdAt: new Date().toISOString(),
        scheduledFor: `${slot.date}T07:30:00`,
      });
    }

    queueStore.setBatchProgress({
      total: slots.length,
      completed: 0,
      failed: 0,
      inProgress: true,
    });

    // Navigate to queue
    router.push("/queue");

    // Stream batch generation in background
    try {
      const batchRes = await fetch("/api/studio/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots, brand: brandContext, strategy: strategyContext }),
      });

      const reader = batchRes.body?.getReader();
      const decoder = new TextDecoder();
      const queueItems = useQueueStore.getState().items.filter((i) => i.status === "generating");
      let completed = 0;
      let failed = 0;

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const result = JSON.parse(line);
              const qItem = queueItems[result.index];
              if (!qItem) continue;

              useQueueStore.getState().updateItem(qItem.id, {
                headline: result.headline || qItem.headline,
                caption: result.caption || "",
                hashtags: result.hashtags || [],
                qualityScore: result.qualityScore || 0,
                status: result.status === "success" ? "pending_approval" : "failed",
                error: result.error,
              });

              if (result.status === "success") completed++;
              else failed++;

              useQueueStore.getState().setBatchProgress({
                total: slots.length,
                completed: completed + failed,
                failed,
                inProgress: completed + failed < slots.length,
              });
            } catch {
              // Skip malformed
            }
          }
        }
      }

      useQueueStore.getState().setBatchProgress({
        total: slots.length,
        completed: completed + failed,
        failed,
        inProgress: false,
      });
    } catch {
      // Batch gen failed — items stay as "generating"
    }
  };

  return (
    <PageTransition>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Design Preview</h1>
          <p className="text-sm text-muted-foreground">
            Review the look & feel of your content before we generate everything.
          </p>
        </div>

        {/* Design summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center">
                <Palette className="h-4 w-4 text-ig-pink" />
              </div>
              <div>
                <p className="text-xs font-medium">Colors</p>
                <div className="flex gap-1 mt-1">
                  <div
                    className="h-4 w-4 rounded-full border border-border/40"
                    style={{ backgroundColor: savedBrand.primaryColor }}
                  />
                  <div
                    className="h-4 w-4 rounded-full border border-border/40"
                    style={{ backgroundColor: savedBrand.secondaryColor }}
                  />
                  <div
                    className="h-4 w-4 rounded-full border border-border/40"
                    style={{ backgroundColor: savedBrand.accentColor }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center">
                <Type className="h-4 w-4 text-ig-orange" />
              </div>
              <div>
                <p className="text-xs font-medium">Fonts</p>
                <p className="text-[11px] text-muted-foreground">
                  {savedBrand.fontHeadline} / {savedBrand.fontBody}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center">
                <Layout className="h-4 w-4 text-ig-purple" />
              </div>
              <div>
                <p className="text-xs font-medium">Content Mix</p>
                <p className="text-[11px] text-muted-foreground">
                  {strategy?.contentFormats
                    ? `${strategy.contentFormats.reels}% Reels · ${strategy.contentFormats.carousels}% Carousels · ${strategy.contentFormats.images}% Images`
                    : "Balanced mix"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sample posts */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-ig-pink" />
                Sample Posts
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRegenerate}
                disabled={loading || regenerating}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1.5 ${regenerating ? "animate-spin" : ""}`}
                />
                Regenerate
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              These sample posts show the style, tone, and format your content will follow.
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 text-ig-pink animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Generating sample posts...
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {samples.map((sample, i) => (
                  <div key={i} className="space-y-3">
                    {/* Mini iPhone mockup */}
                    <IPhoneMockup className="w-full max-w-[200px] mx-auto">
                      <div className="h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex flex-col">
                        <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-white/10">
                          <div className="h-4 w-4 rounded-full ig-gradient" />
                          <span className="text-white text-[8px] font-medium">
                            {savedBrand.brandHashtag?.replace("#", "") || "yourbrand"}
                          </span>
                        </div>
                        <div
                          className="flex-1 flex items-center justify-center p-3"
                          style={{
                            background: `linear-gradient(135deg, ${savedBrand.primaryColor}, ${savedBrand.secondaryColor})`,
                          }}
                        >
                          <p className="text-[9px] font-bold text-white text-center leading-tight">
                            {sample.headline}
                          </p>
                        </div>
                        <div className="px-2 py-1.5">
                          <div className="flex gap-1.5 mb-1">
                            <div className="h-2.5 w-2.5 rounded-full border border-white/30" />
                            <div className="h-2.5 w-2.5 rounded-full border border-white/30" />
                          </div>
                        </div>
                      </div>
                    </IPhoneMockup>

                    {/* Post details */}
                    <div className="space-y-1.5 px-1">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px]">
                          {sample.pillar}
                        </Badge>
                        <Badge variant="outline" className="text-[9px]">
                          {sample.contentType}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                        {sample.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push("/strategy/review")}>
            Back to Strategy
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/settings")}>
              Adjust Settings
            </Button>
            <Button onClick={handleApproveDesign} disabled={loading}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Approve Design & Generate All
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
