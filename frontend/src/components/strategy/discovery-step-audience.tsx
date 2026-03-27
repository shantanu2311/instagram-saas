"use client";

import { useState } from "react";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Users, X, Plus } from "lucide-react";

const presetDemographics = [
  "Tech-savvy",
  "Health-conscious",
  "Parents",
  "Students",
  "Professionals",
  "Creatives",
  "Entrepreneurs",
  "Gen Z",
  "Millennials",
  "Luxury buyers",
];

const genderOptions = [
  { value: "all", label: "All" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export function DiscoveryStepAudience() {
  const { profile, updateProfile, nextDiscoveryStep, prevDiscoveryStep } =
    useStrategyStore();
  const [customTag, setCustomTag] = useState("");

  const toggleDemographic = (tag: string) => {
    const current = profile.targetDemographics;
    if (current.includes(tag)) {
      updateProfile({
        targetDemographics: current.filter((t) => t !== tag),
      });
    } else {
      updateProfile({
        targetDemographics: [...current, tag],
      });
    }
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !profile.targetDemographics.includes(trimmed)) {
      updateProfile({
        targetDemographics: [...profile.targetDemographics, trimmed],
      });
      setCustomTag("");
    }
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center mb-4">
          <Users className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Who is your audience?</h2>
        <p className="text-muted-foreground">
          Help us understand who you want to reach on Instagram.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-2">
          {/* Age Range */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Target Age Range</label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={profile.targetAgeMin}
                onChange={(e) =>
                  updateProfile({
                    targetAgeMin: Math.max(13, Number(e.target.value)),
                  })
                }
                min={13}
                max={100}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="number"
                value={profile.targetAgeMax}
                onChange={(e) =>
                  updateProfile({
                    targetAgeMax: Math.min(100, Number(e.target.value)),
                  })
                }
                min={13}
                max={100}
                className="w-24"
              />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Target Gender</label>
            <div className="flex gap-2">
              {genderOptions.map((g) => (
                <button
                  key={g.value}
                  onClick={() => updateProfile({ targetGender: g.value })}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-all ${
                    profile.targetGender === g.value
                      ? "border-ig-pink bg-ig-pink/10 text-ig-pink ring-1 ring-ig-pink/30"
                      : "border-border/40 text-muted-foreground hover:border-ig-pink/50"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Target Location</label>
            <Input
              value={profile.targetLocation}
              onChange={(e) =>
                updateProfile({ targetLocation: e.target.value })
              }
              placeholder="e.g., United States, Global, New York"
            />
          </div>

          {/* Demographics / Interests */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Interests &amp; Demographics
            </label>
            <div className="flex flex-wrap gap-2">
              {presetDemographics.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleDemographic(tag)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    profile.targetDemographics.includes(tag)
                      ? "border-ig-pink bg-ig-pink/10 text-ig-pink"
                      : "border-border/40 text-muted-foreground hover:border-ig-pink/50"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {/* Custom tag input */}
            <div className="flex gap-2">
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
                placeholder="Add custom interest..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomTag}
                disabled={!customTag.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {/* Selected custom tags */}
            {profile.targetDemographics.filter(
              (t) => !presetDemographics.includes(t)
            ).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.targetDemographics
                  .filter((t) => !presetDemographics.includes(t))
                  .map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-ig-pink bg-ig-pink/10 px-2.5 py-0.5 text-xs text-ig-pink"
                    >
                      {tag}
                      <button onClick={() => toggleDemographic(tag)}>
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
        <Button onClick={nextDiscoveryStep} size="lg" className="px-12" disabled={!profile.targetLocation.trim()}>
          Continue
        </Button>
      </div>
    </div>
  );
}
