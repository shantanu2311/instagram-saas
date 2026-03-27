"use client";

import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import {
  Users,
  Heart,
  ShoppingBag,
  Eye,
  MessageSquare,
  Award,
  Target,
} from "lucide-react";

const goalOptions = [
  {
    id: "follower_growth",
    label: "Follower Growth",
    description: "Grow your audience consistently",
    icon: Users,
  },
  {
    id: "engagement",
    label: "Engagement",
    description: "More likes, comments, and shares",
    icon: Heart,
  },
  {
    id: "sales",
    label: "Sales & Conversions",
    description: "Drive traffic and revenue",
    icon: ShoppingBag,
  },
  {
    id: "brand_awareness",
    label: "Brand Awareness",
    description: "Get discovered by new audiences",
    icon: Eye,
  },
  {
    id: "community",
    label: "Community Building",
    description: "Build a loyal, engaged community",
    icon: MessageSquare,
  },
  {
    id: "thought_leadership",
    label: "Thought Leadership",
    description: "Become an authority in your niche",
    icon: Award,
  },
];

export function DiscoveryStepGoals() {
  const { profile, updateProfile, nextDiscoveryStep, prevDiscoveryStep } =
    useStrategyStore();

  const toggleGoal = (id: string) => {
    const current = profile.goals;
    if (current.includes(id)) {
      updateProfile({ goals: current.filter((g) => g !== id) });
    } else if (current.length < 3) {
      updateProfile({ goals: [...current, id] });
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center mb-4">
          <Target className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">What are your goals?</h2>
        <p className="text-muted-foreground">
          Select 1-3 goals to focus your content strategy.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {goalOptions.map((goal) => {
          const selected = profile.goals.includes(goal.id);
          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-5 transition-all text-center hover:border-ig-pink/50 hover:bg-ig-pink/5 ${
                selected
                  ? "border-ig-pink bg-ig-pink/10 ring-1 ring-ig-pink/30"
                  : "border-border/40"
              }`}
            >
              <goal.icon
                className={`h-7 w-7 ${
                  selected ? "text-ig-pink" : "text-muted-foreground"
                }`}
              />
              <span className="text-sm font-medium">{goal.label}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                {goal.description}
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
          disabled={profile.goals.length < 1}
          size="lg"
          className="px-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
