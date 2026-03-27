"use client";

import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Laugh,
  Sparkles,
  Camera,
  BookOpen,
  Megaphone,
  Palette,
} from "lucide-react";

const contentStyles = [
  {
    id: "educational",
    label: "Educational",
    description: "Teach your audience something valuable",
    icon: GraduationCap,
  },
  {
    id: "entertaining",
    label: "Entertaining",
    description: "Make them smile, share, and come back",
    icon: Laugh,
  },
  {
    id: "inspirational",
    label: "Inspirational",
    description: "Motivate and uplift your audience",
    icon: Sparkles,
  },
  {
    id: "behind_the_scenes",
    label: "Behind-the-Scenes",
    description: "Show the real you and your process",
    icon: Camera,
  },
  {
    id: "storytelling",
    label: "Storytelling",
    description: "Share narratives that resonate",
    icon: BookOpen,
  },
  {
    id: "promotional",
    label: "Promotional",
    description: "Showcase your products and offers",
    icon: Megaphone,
  },
];

export function DiscoveryStepContentPrefs() {
  const { profile, updateProfile, nextDiscoveryStep, prevDiscoveryStep } =
    useStrategyStore();

  const togglePref = (id: string) => {
    const current = profile.contentPreferences;
    if (current.includes(id)) {
      updateProfile({
        contentPreferences: current.filter((p) => p !== id),
      });
    } else {
      updateProfile({
        contentPreferences: [...current, id],
      });
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center mb-4">
          <Palette className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">What content style fits you?</h2>
        <p className="text-muted-foreground">
          Select the styles that match your brand. Choose as many as you like.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {contentStyles.map((style) => {
          const selected = profile.contentPreferences.includes(style.id);
          return (
            <button
              key={style.id}
              onClick={() => togglePref(style.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-5 transition-all text-center hover:border-ig-pink/50 hover:bg-ig-pink/5 ${
                selected
                  ? "border-ig-pink bg-ig-pink/10 ring-1 ring-ig-pink/30"
                  : "border-border/40"
              }`}
            >
              <style.icon
                className={`h-7 w-7 ${
                  selected ? "text-ig-pink" : "text-muted-foreground"
                }`}
              />
              <span className="text-sm font-medium">{style.label}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                {style.description}
              </span>
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
          disabled={profile.contentPreferences.length < 1}
          size="lg"
          className="px-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
