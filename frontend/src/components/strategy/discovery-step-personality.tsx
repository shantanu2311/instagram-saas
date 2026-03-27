"use client";

import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Palette, Sparkles } from "lucide-react";

const personalityTraits = [
  "Bold",
  "Minimal",
  "Playful",
  "Luxurious",
  "Edgy",
  "Warm",
  "Professional",
  "Quirky",
  "Elegant",
  "Authentic",
  "Innovative",
  "Trustworthy",
];

export function DiscoveryStepPersonality() {
  const { profile, updateProfile, nextDiscoveryStep, prevDiscoveryStep } =
    useStrategyStore();

  const toggleTrait = (trait: string) => {
    const current = profile.brandPersonality;
    if (current.includes(trait)) {
      updateProfile({
        brandPersonality: current.filter((t) => t !== trait),
      });
    } else if (current.length < 5) {
      updateProfile({
        brandPersonality: [...current, trait],
      });
    }
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center mb-4">
          <Palette className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Your brand personality</h2>
        <p className="text-muted-foreground">
          Pick 2–5 words that describe your vibe. This shapes your content tone.
        </p>
        {profile.brandPersonality.length > 0 && (
          <p className="text-xs font-medium text-ig-pink">
            {profile.brandPersonality.length} of 5 selected
          </p>
        )}
      </div>

      <Card>
        <CardContent className="space-y-5 pt-2">
          <div className="flex flex-wrap gap-2">
            {personalityTraits.map((trait) => {
              const selected = profile.brandPersonality.includes(trait);
              return (
                <button
                  key={trait}
                  onClick={() => toggleTrait(trait)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-all ${
                    selected
                      ? "border-ig-pink bg-ig-pink/10 text-ig-pink ring-1 ring-ig-pink/30"
                      : "border-border/40 text-muted-foreground hover:border-ig-pink/50 hover:text-foreground"
                  }`}
                >
                  {trait}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {profile.accountType === "business"
                ? "What problems does your target audience face?"
                : "What challenges do you face with Instagram?"}
            </label>
            <p className="text-[11px] text-muted-foreground">Optional — one per line</p>
            <textarea
              value={profile.painPoints.join("\n")}
              onChange={(e) => {
                const lines = e.target.value.split("\n");
                updateProfile({ painPoints: lines });
              }}
              placeholder={
                profile.accountType === "business"
                  ? "e.g., Not enough time to create content\nDon't know what to post\nLow engagement on posts"
                  : "e.g., Struggling with consistency\nNot sure what my niche is\nDon't know how to grow"
              }
              rows={3}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={prevDiscoveryStep} size="lg">
          Back
        </Button>
        <Button
          onClick={nextDiscoveryStep}
          disabled={profile.brandPersonality.length < 1}
          size="lg"
          className="px-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
