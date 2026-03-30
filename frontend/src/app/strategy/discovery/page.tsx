"use client";

import { useStrategyStore } from "@/lib/stores/strategy-store";
import { DiscoveryStepAccountType } from "@/components/strategy/discovery-step-account-type";
import { DiscoveryStepBusiness } from "@/components/strategy/discovery-step-business";
import { DiscoveryStepAudience } from "@/components/strategy/discovery-step-audience";
import { DiscoveryStepCompetitors } from "@/components/strategy/discovery-step-competitors";
import { DiscoveryStepGoals } from "@/components/strategy/discovery-step-goals";
import { DiscoveryStepContentPrefs } from "@/components/strategy/discovery-step-content-prefs";
import { DiscoveryStepHistory } from "@/components/strategy/discovery-step-history";
import { DiscoveryStepPersonality } from "@/components/strategy/discovery-step-personality";
import { DiscoveryStepBrandIdentity } from "@/components/strategy/discovery-step-brand-identity";
import { DiscoveryStepVoice } from "@/components/strategy/discovery-step-voice";
import { DiscoveryStepCollaterals } from "@/components/strategy/discovery-step-collaterals";
import { DiscoveryStepUsp } from "@/components/strategy/discovery-step-usp";
import Image from "next/image";

const steps = [
  { label: "Type", component: DiscoveryStepAccountType },
  { label: "About", component: DiscoveryStepBusiness },
  { label: "Audience", component: DiscoveryStepAudience },
  { label: "Competitors", component: DiscoveryStepCompetitors },
  { label: "Goals", component: DiscoveryStepGoals },
  { label: "Content", component: DiscoveryStepContentPrefs },
  { label: "Experience", component: DiscoveryStepHistory },
  { label: "Personality", component: DiscoveryStepPersonality },
  { label: "Brand Look", component: DiscoveryStepBrandIdentity },
  { label: "Voice", component: DiscoveryStepVoice },
  { label: "Materials", component: DiscoveryStepCollaterals },
  { label: "USP", component: DiscoveryStepUsp },
];

export default function DiscoveryPage() {
  const { discoveryStep, setDiscoveryStep } = useStrategyStore();
  const CurrentStep = steps[discoveryStep]?.component ?? steps[0].component;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/kuraite-icon.png" alt="Kuraite" width={32} height={32} className="rounded-lg" />
            <span className="font-semibold">Strategy Discovery</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center">
                <button
                  onClick={() => i < discoveryStep && setDiscoveryStep(i)}
                  disabled={i >= discoveryStep}
                  title={i < discoveryStep ? `Back to ${s.label}` : s.label}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === discoveryStep
                      ? "bg-ig-pink ring-2 ring-ig-pink/30"
                      : i < discoveryStep
                      ? "bg-ig-pink hover:ring-2 hover:ring-ig-pink/30 cursor-pointer"
                      : "bg-muted"
                  }`}
                />
                {i < steps.length - 1 && (
                  <div
                    className={`h-px w-1.5 sm:w-3 transition-colors ${
                      i < discoveryStep ? "bg-ig-pink" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {discoveryStep + 1}/{steps.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-12">
        <CurrentStep key={discoveryStep} />
      </div>
    </div>
  );
}
