"use client";

import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Heart,
  ShoppingBag,
  Eye,
  MessageSquare,
  Award,
  Target,
  DollarSign,
  Briefcase,
  Palette,
  Smile,
  BookOpen,
} from "lucide-react";

const goalOptions = [
  // Universal goals
  {
    id: "follower_growth",
    label: "Grow Followers",
    description: "Build a larger, targeted audience",
    icon: Users,
    for: ["business", "creator", "personal"],
  },
  {
    id: "engagement",
    label: "Boost Engagement",
    description: "More likes, comments, saves, and shares",
    icon: Heart,
    for: ["business", "creator", "personal"],
  },
  {
    id: "brand_awareness",
    label: "Get Discovered",
    description: "Reach new people who don't know you yet",
    icon: Eye,
    for: ["business", "creator", "personal"],
  },
  {
    id: "community",
    label: "Build Community",
    description: "Create a loyal, engaged tribe",
    icon: MessageSquare,
    for: ["business", "creator", "personal"],
  },
  // Business-focused
  {
    id: "sales",
    label: "Drive Sales",
    description: "Convert followers into customers",
    icon: ShoppingBag,
    for: ["business"],
  },
  {
    id: "thought_leadership",
    label: "Thought Leadership",
    description: "Become the authority in your space",
    icon: Award,
    for: ["business", "creator"],
  },
  // Creator-focused
  {
    id: "monetize",
    label: "Monetize",
    description: "Brand deals, sponsorships, or selling your own products",
    icon: DollarSign,
    for: ["creator"],
  },
  {
    id: "portfolio",
    label: "Showcase Work",
    description: "Use Instagram as a portfolio or resume",
    icon: Briefcase,
    for: ["creator", "personal"],
  },
  {
    id: "personal_brand",
    label: "Personal Brand",
    description: "Be recognized and respected in your niche",
    icon: Award,
    for: ["creator", "personal"],
  },
  // Personal-focused
  {
    id: "self_expression",
    label: "Self-Expression",
    description: "Share your life, creativity, and perspective",
    icon: Palette,
    for: ["personal"],
  },
  {
    id: "fun",
    label: "Have Fun",
    description: "Enjoy creating content without pressure",
    icon: Smile,
    for: ["personal"],
  },
  {
    id: "learn",
    label: "Learn & Connect",
    description: "Connect with like-minded people",
    icon: BookOpen,
    for: ["personal"],
  },
];

export function DiscoveryStepGoals() {
  const { profile, updateProfile, nextDiscoveryStep, prevDiscoveryStep } =
    useStrategyStore();

  // Filter goals by account type, plus always show universal ones
  const availableGoals = goalOptions.filter((g) =>
    g.for.includes(profile.accountType || "business")
  );

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
          Select 1–3 goals to focus your content strategy.
        </p>
        {profile.goals.length > 0 && (
          <p className="text-xs font-medium text-ig-pink">
            {profile.goals.length} of 3 selected
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {availableGoals.map((goal) => {
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

      {/* Ambition / Vision */}
      <Card>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Your Vision
            </label>
            <p className="text-[11px] text-muted-foreground">
              Where do you want to be in 6 months? What does success look like for you?
            </p>
            <textarea
              value={profile.ambition}
              onChange={(e) => updateProfile({ ambition: e.target.value })}
              placeholder={
                profile.accountType === "business"
                  ? "e.g., Become the go-to brand for organic skincare in India with 50K engaged followers driving 20% of our online sales"
                  : profile.accountType === "creator"
                  ? "e.g., Hit 100K followers, land 3 brand deals/month, and launch my own course on digital marketing"
                  : "e.g., Build a beautiful photography feed with 10K followers who genuinely engage with my travel stories"
              }
              rows={3}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          {(profile.accountType === "creator" || profile.accountType === "business") && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {profile.accountType === "creator"
                  ? "How do you want to monetize?"
                  : "Revenue Goal"}
              </label>
              <textarea
                value={profile.monetizationGoal}
                onChange={(e) =>
                  updateProfile({ monetizationGoal: e.target.value })
                }
                placeholder={
                  profile.accountType === "creator"
                    ? "e.g., Brand sponsorships, affiliate marketing, selling my presets, coaching calls"
                    : "e.g., Drive $10K/month in sales from Instagram, generate 200 leads/month"
                }
                rows={2}
                className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
              />
            </div>
          )}
        </CardContent>
      </Card>

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
