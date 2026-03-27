"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Gem, X, Plus, Rocket, Loader2 } from "lucide-react";

export function DiscoveryStepUsp() {
  const router = useRouter();
  const {
    profile,
    updateProfile,
    prevDiscoveryStep,
    setResearchStatus,
    setResearchProgress,
  } = useStrategyStore();
  const [diffInput, setDiffInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addDifferentiator = () => {
    const trimmed = diffInput.trim();
    if (trimmed && !profile.keyDifferentiators.includes(trimmed)) {
      updateProfile({
        keyDifferentiators: [...profile.keyDifferentiators, trimmed],
      });
      setDiffInput("");
    }
  };

  const removeDifferentiator = (d: string) => {
    updateProfile({
      keyDifferentiators: profile.keyDifferentiators.filter((x) => x !== d),
    });
  };

  const handleStartResearch = async () => {
    setSubmitting(true);
    try {
      // Save discovery profile
      await fetch("/api/strategy/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      // Start async research
      setResearchStatus("running");
      setResearchProgress(0);

      await fetch("/api/strategy/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });

      router.push("/strategy/research");
    } catch {
      // Even on error, navigate to research page — it handles mock data
      setResearchStatus("running");
      router.push("/strategy/research");
    }
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center mb-4">
          <Gem className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">What makes you unique?</h2>
        <p className="text-muted-foreground">
          Your unique selling proposition helps us differentiate your content
          from competitors.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Your Unique Selling Proposition
            </label>
            <textarea
              value={profile.usp}
              onChange={(e) => updateProfile({ usp: e.target.value })}
              placeholder="e.g., We're the only fitness brand that combines AI-powered meal plans with live coaching for busy professionals."
              rows={3}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Key Differentiators</label>
            <div className="flex gap-2">
              <Input
                value={diffInput}
                onChange={(e) => setDiffInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDifferentiator()}
                placeholder="Add a differentiator..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="default"
                onClick={addDifferentiator}
                disabled={!diffInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {profile.keyDifferentiators.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.keyDifferentiators.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 rounded-full border border-ig-pink bg-ig-pink/10 px-2.5 py-0.5 text-xs text-ig-pink"
                  >
                    {d}
                    <button onClick={() => removeDifferentiator(d)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={prevDiscoveryStep} size="lg">
          Back
        </Button>
        <Button
          onClick={handleStartResearch}
          disabled={submitting}
          size="lg"
          className="px-8 gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              Start Research
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
