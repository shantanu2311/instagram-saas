"use client";

import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { StepNiche } from "@/components/onboarding/step-niche";
import { StepBrandVisual } from "@/components/onboarding/step-brand-visual";
import { StepVoice } from "@/components/onboarding/step-voice";
import { StepContentPillars } from "@/components/onboarding/step-content-pillars";
import { Sparkles } from "lucide-react";

const steps = [
  { label: "Niche", component: StepNiche },
  { label: "Brand", component: StepBrandVisual },
  { label: "Voice", component: StepVoice },
  { label: "Strategy", component: StepContentPillars },
];

export default function OnboardingPage() {
  const { step } = useOnboardingStore();
  const CurrentStep = steps[step].component;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg ig-gradient flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">IGCreator</span>
          </div>
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center">
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i <= step ? "bg-ig-pink" : "bg-muted"
                  }`}
                />
                {i < steps.length - 1 && (
                  <div
                    className={`h-px w-8 transition-colors ${
                      i < step ? "bg-ig-pink" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            Step {step + 1} of {steps.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-12">
        <CurrentStep key={step} />
      </div>
    </div>
  );
}
