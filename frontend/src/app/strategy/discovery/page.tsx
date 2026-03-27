"use client";

import { useStrategyStore } from "@/lib/stores/strategy-store";
import { DiscoveryStepBusiness } from "@/components/strategy/discovery-step-business";
import { DiscoveryStepAudience } from "@/components/strategy/discovery-step-audience";
import { DiscoveryStepCompetitors } from "@/components/strategy/discovery-step-competitors";
import { DiscoveryStepGoals } from "@/components/strategy/discovery-step-goals";
import { DiscoveryStepContentPrefs } from "@/components/strategy/discovery-step-content-prefs";
import { DiscoveryStepHistory } from "@/components/strategy/discovery-step-history";
import { DiscoveryStepPersonality } from "@/components/strategy/discovery-step-personality";
import { DiscoveryStepUsp } from "@/components/strategy/discovery-step-usp";
import { Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const steps = [
  { label: "Business", component: DiscoveryStepBusiness },
  { label: "Audience", component: DiscoveryStepAudience },
  { label: "Competitors", component: DiscoveryStepCompetitors },
  { label: "Goals", component: DiscoveryStepGoals },
  { label: "Content", component: DiscoveryStepContentPrefs },
  { label: "Experience", component: DiscoveryStepHistory },
  { label: "Brand", component: DiscoveryStepPersonality },
  { label: "USP", component: DiscoveryStepUsp },
];

export default function DiscoveryPage() {
  const { discoveryStep } = useStrategyStore();
  const CurrentStep = steps[discoveryStep].component;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg ig-gradient flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Strategy Discovery</span>
          </div>
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center">
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i <= discoveryStep ? "bg-ig-pink" : "bg-muted"
                  }`}
                />
                {i < steps.length - 1 && (
                  <div
                    className={`h-px w-4 transition-colors ${
                      i < discoveryStep ? "bg-ig-pink" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            Step {discoveryStep + 1} of {steps.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-12">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={discoveryStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <CurrentStep />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
