"use client";

import { useState } from "react";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Lightbulb,
  BookOpen,
  MessageSquare,
  Video,
  Users,
  TrendingUp,
  Star,
  Megaphone,
} from "lucide-react";
import { useRouter } from "next/navigation";

const pillarOptions = [
  {
    id: "facts",
    label: "Quick Facts & Insights",
    desc: "Surprising data points and quick-read cards",
    icon: Lightbulb,
  },
  {
    id: "education",
    label: "Educational Carousels",
    desc: "Deep-dive content with multiple slides",
    icon: BookOpen,
  },
  {
    id: "behind-the-scenes",
    label: "Behind the Scenes",
    desc: "Founder stories, process reveals, authenticity",
    icon: Star,
  },
  {
    id: "engagement",
    label: "Engagement & CTAs",
    desc: "Questions, polls, challenges, community building",
    icon: MessageSquare,
  },
  {
    id: "reels",
    label: "Short-Form Reels",
    desc: "Animated text videos with cinematic audio",
    icon: Video,
  },
  {
    id: "testimonials",
    label: "Social Proof",
    desc: "Reviews, testimonials, case studies",
    icon: Users,
  },
  {
    id: "trends",
    label: "Trend-Jacking",
    desc: "Seasonal content, trending formats",
    icon: TrendingUp,
  },
  {
    id: "promotions",
    label: "Offers & Promotions",
    desc: "Product launches, sales, special announcements",
    icon: Megaphone,
  },
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function StepContentPillars() {
  const { brand, updateBrand, prevStep } = useOnboardingStore();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const togglePillar = (id: string) => {
    const current = brand.contentPillars;
    if (current.includes(id)) {
      updateBrand({ contentPillars: current.filter((p) => p !== id) });
    } else {
      updateBrand({ contentPillars: [...current, id] });
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brand),
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch {
      // Fallback: go to dashboard even if save fails (dev mode)
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Content strategy</h2>
        <p className="text-muted-foreground">
          Pick your content pillars and posting frequency.
        </p>
      </div>

      {/* Pillar selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Select your content pillars (pick 3-5)
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pillarOptions.map((p) => {
            const selected = brand.contentPillars.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePillar(p.id)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover:border-purple-500/50 ${
                  selected
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-border/40"
                }`}
              >
                <p.icon
                  className={`h-5 w-5 mt-0.5 shrink-0 ${
                    selected ? "text-purple-500" : "text-muted-foreground"
                  }`}
                />
                <div>
                  <p className="font-medium text-sm">{p.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts per week */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Posts per week</Label>
        <div className="flex gap-2">
          {[3, 5, 7].map((n) => (
            <button
              key={n}
              onClick={() => updateBrand({ postsPerWeek: n })}
              className={`flex-1 rounded-lg border py-3 text-center text-sm font-medium transition-all ${
                brand.postsPerWeek === n
                  ? "border-purple-500 bg-purple-500/10 text-purple-500"
                  : "border-border/40 text-muted-foreground hover:border-purple-500/30"
              }`}
            >
              {n}x / week
            </button>
          ))}
        </div>
      </div>

      {/* Weekly schedule preview */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Weekly schedule</Label>
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((day, i) => {
            const contentType = brand.postingDays[String(i)] || "rest";
            return (
              <div
                key={day}
                className="rounded-lg border border-border/40 p-2 text-center space-y-1"
              >
                <p className="text-[10px] text-muted-foreground font-medium">
                  {day}
                </p>
                <p className="text-[10px] capitalize">{contentType}</p>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          You can customize your daily schedule later from settings.
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={prevStep}>
          Back
        </Button>
        <Button
          onClick={handleFinish}
          disabled={brand.contentPillars.length < 2 || saving}
          size="lg"
          className="px-12"
        >
          {saving ? "Setting up..." : "Launch Dashboard"}
        </Button>
      </div>
    </div>
  );
}
