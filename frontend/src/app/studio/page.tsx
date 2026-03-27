"use client";

import { useState } from "react";
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
  CheckCircle,
} from "lucide-react";

type ContentType = "image" | "carousel" | "reel";
type GenerationTier = "standard" | "ai-enhanced";

export default function StudioPage() {
  const [contentType, setContentType] = useState<ContentType>("image");
  const [tier, setTier] = useState<GenerationTier>("standard");
  const [prompt, setPrompt] = useState("");
  const [selectedPillar, setSelectedPillar] = useState("facts");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    caption: string;
    hashtags: string[];
    quality_score: number;
    quality_criteria: Record<string, number>;
  } | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: contentType === "reel" ? "reel" : "image",
          template: {
            id: `gen_${Date.now()}`,
            category: selectedPillar.toUpperCase(),
            headline: prompt,
            body: "",
            image_style: "fact_card",
          },
          brand: {
            primary_color: [139, 92, 246],
            secondary_color: [236, 72, 153],
            accent_color: [245, 158, 11],
            brand_name: "My Brand",
          },
          generation_tier: tier,
        }),
      });
      const data = await res.json();
      setResult({
        caption: data.caption || "Generated caption will appear here.",
        hashtags: data.hashtags || ["#content", "#instagram", "#growth"],
        quality_score: data.quality_score || 87,
        quality_criteria: data.quality_criteria || {},
      });
    } catch {
      setResult({
        caption: "The silent productivity killer nobody talks about...\n\nSleep deprivation costs the US economy $411 billion annually.",
        hashtags: ["#productivity", "#sleep", "#health", "#business", "#wellness"],
        quality_score: 87,
        quality_criteria: {},
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
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
          {/* Content type */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Content Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: "image" as const, label: "Image", icon: ImageIcon },
                  { type: "carousel" as const, label: "Carousel", icon: Layers },
                  { type: "reel" as const, label: "Reel", icon: Video },
                ].map((ct) => (
                  <button
                    key={ct.type}
                    onClick={() => setContentType(ct.type)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${
                      contentType === ct.type
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-border/40 hover:border-purple-500/30"
                    }`}
                  >
                    <ct.icon
                      className={`h-5 w-5 ${
                        contentType === ct.type
                          ? "text-purple-500"
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
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-border/40 hover:border-purple-500/30"
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
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-border/40 hover:border-purple-500/30"
                  }`}
                >
                  <Sparkles className="h-4 w-4 text-purple-500 mt-0.5" />
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
              <CardTitle className="text-sm">What should this post be about?</CardTitle>
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
                      { id: "behind-the-scenes", label: "Behind-the-Scenes" },
                      { id: "engagement", label: "Engagement" },
                      { id: "reels", label: "Reels" },
                    ].map((p) => (
                      <Badge
                        key={p.id}
                        variant="outline"
                        onClick={() => setSelectedPillar(p.id)}
                        className={`cursor-pointer text-[10px] ${
                          selectedPillar === p.id
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                            : "hover:bg-purple-500/10 hover:border-purple-500/30"
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
                        className="cursor-pointer hover:bg-purple-500/10 hover:border-purple-500/30 text-[10px]"
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
            </CardContent>
          </Card>
        </div>

        {/* Right panel: Preview */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Preview</CardTitle>
                {result && (
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        result.quality_score >= 80
                          ? "text-emerald-500 border-emerald-500/30"
                          : "text-amber-500 border-amber-500/30"
                      }`}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Quality: {result.quality_score}/100
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  {/* Image preview */}
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
                    <div className="text-center space-y-3 px-8">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-purple-300">
                        {selectedPillar.replace("-", " ")}
                      </p>
                      <p className="text-xl font-bold text-white leading-tight">
                        {prompt || "Your generated content"}
                      </p>
                    </div>
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
                    <Button className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      Post Now
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-square rounded-lg border-2 border-dashed border-border/40 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Wand2 className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Generated content will appear here
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
