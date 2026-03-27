"use client";

import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import { Clock, Sprout, TrendingUp, Crown } from "lucide-react";

const experienceLevels = [
  {
    id: "new",
    label: "Brand New",
    description: "Starting fresh — 0 posts yet",
    icon: Sprout,
  },
  {
    id: "beginner",
    label: "Getting Started",
    description: "Under 50 posts, still figuring things out",
    icon: Clock,
  },
  {
    id: "growing",
    label: "Growing",
    description: "50–200 posts, building momentum",
    icon: TrendingUp,
  },
  {
    id: "established",
    label: "Established",
    description: "200+ posts, consistent presence",
    icon: Crown,
  },
];

export function DiscoveryStepHistory() {
  const { profile, updateProfile, nextDiscoveryStep, prevDiscoveryStep } =
    useStrategyStore();

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center mb-4">
          <Clock className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Your Instagram experience</h2>
        <p className="text-muted-foreground">
          This helps us calibrate the strategy to your current level.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {experienceLevels.map((level) => {
          const selected = profile.postingHistory === level.id;
          return (
            <button
              key={level.id}
              onClick={() => updateProfile({ postingHistory: level.id })}
              className={`flex flex-col items-center gap-3 rounded-xl border p-6 transition-all text-center hover:border-ig-pink/50 hover:bg-ig-pink/5 ${
                selected
                  ? "border-ig-pink bg-ig-pink/10 ring-1 ring-ig-pink/30"
                  : "border-border/40"
              }`}
            >
              <level.icon
                className={`h-8 w-8 ${
                  selected ? "text-ig-pink" : "text-muted-foreground"
                }`}
              />
              <div>
                <span className="text-sm font-medium block">{level.label}</span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  {level.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={prevDiscoveryStep} size="lg">
          Back
        </Button>
        <Button
          onClick={nextDiscoveryStep}
          disabled={!profile.postingHistory}
          size="lg"
          className="px-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
