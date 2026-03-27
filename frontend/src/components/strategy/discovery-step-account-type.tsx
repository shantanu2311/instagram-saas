"use client";

import { useStrategyStore, type AccountType } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import { Building2, Mic2, User, Sparkles } from "lucide-react";

const accountTypes = [
  {
    id: "business" as AccountType,
    label: "Business",
    description: "Company, brand, or organization promoting products or services",
    icon: Building2,
    examples: "Restaurants, agencies, e-commerce, startups",
  },
  {
    id: "creator" as AccountType,
    label: "Content Creator",
    description: "Building a personal brand, audience, or community around your content",
    icon: Mic2,
    examples: "Influencers, educators, coaches, artists, freelancers",
  },
  {
    id: "personal" as AccountType,
    label: "Personal",
    description: "Growing your personal account for fun, networking, or self-expression",
    icon: User,
    examples: "Hobbyists, professionals, students, passion projects",
  },
];

export function DiscoveryStepAccountType() {
  const { profile, updateProfile, nextDiscoveryStep } = useStrategyStore();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">What kind of account is this?</h2>
        <p className="text-muted-foreground">
          This shapes your entire strategy — from content style to growth tactics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {accountTypes.map((type) => {
          const selected = profile.accountType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => updateProfile({ accountType: type.id })}
              className={`flex flex-col items-center gap-3 rounded-xl border p-6 transition-all text-center hover:border-ig-pink/50 hover:bg-ig-pink/5 ${
                selected
                  ? "border-ig-pink bg-ig-pink/10 ring-1 ring-ig-pink/30"
                  : "border-border/40"
              }`}
            >
              <type.icon
                className={`h-8 w-8 ${
                  selected ? "text-ig-pink" : "text-muted-foreground"
                }`}
              />
              <div className="space-y-1">
                <span className="text-sm font-semibold block">{type.label}</span>
                <span className="text-[11px] text-muted-foreground leading-tight block">
                  {type.description}
                </span>
                <span className="text-[10px] text-muted-foreground/60 italic block mt-1">
                  {type.examples}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={nextDiscoveryStep}
          disabled={!profile.accountType}
          size="lg"
          className="px-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
