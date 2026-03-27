"use client";

import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  Utensils,
  Palette,
  Code,
  ShoppingBag,
  GraduationCap,
  Camera,
  Music,
  Heart,
  Briefcase,
  Plane,
  Leaf,
} from "lucide-react";

const niches = [
  { id: "fitness", label: "Fitness & Health", icon: Dumbbell },
  { id: "food", label: "Food & Cooking", icon: Utensils },
  { id: "art", label: "Art & Design", icon: Palette },
  { id: "tech", label: "Tech & SaaS", icon: Code },
  { id: "ecommerce", label: "E-commerce", icon: ShoppingBag },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "music", label: "Music", icon: Music },
  { id: "lifestyle", label: "Lifestyle", icon: Heart },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "travel", label: "Travel", icon: Plane },
  { id: "sustainability", label: "Sustainability", icon: Leaf },
];

export function StepNiche() {
  const { brand, updateBrand, nextStep } = useOnboardingStore();

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What&apos;s your niche?</h2>
        <p className="text-muted-foreground">
          This helps us tailor your content strategy and templates.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-2xl mx-auto">
        {niches.map((n) => (
          <button
            key={n.id}
            onClick={() => updateBrand({ niche: n.id })}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all hover:border-ig-pink/50 hover:bg-ig-pink/5 ${
              brand.niche === n.id
                ? "border-ig-pink bg-ig-pink/10 ring-1 ring-ig-pink/30"
                : "border-border/40"
            }`}
          >
            <n.icon
              className={`h-6 w-6 ${
                brand.niche === n.id
                  ? "text-ig-pink"
                  : "text-muted-foreground"
              }`}
            />
            <span className="text-sm font-medium">{n.label}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={nextStep}
          disabled={!brand.niche}
          size="lg"
          className="px-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
