"use client";

import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, X, Plus } from "lucide-react";

const voicePresets = [
  {
    label: "Professional & Authoritative",
    formality: 85,
    humor: 15,
    desc: "Expert insights with data-backed claims. Minimal emojis, polished prose.",
  },
  {
    label: "Friendly & Approachable",
    formality: 35,
    humor: 60,
    desc: "Conversational tone, relatable stories, casual language with personality.",
  },
  {
    label: "Bold & Provocative",
    formality: 50,
    humor: 30,
    desc: "Strong opinions, contrarian takes, attention-grabbing hooks.",
  },
  {
    label: "Educational & Nurturing",
    formality: 60,
    humor: 40,
    desc: "Step-by-step guidance, encouraging tone, clear explanations.",
  },
];

export function DiscoveryStepVoice() {
  const { profile, updateProfile, nextDiscoveryStep, prevDiscoveryStep } =
    useStrategyStore();

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center mb-4">
          <MessageCircle className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Brand Voice</h2>
        <p className="text-muted-foreground">
          Define how your captions should sound. AI will write in this style.
        </p>
      </div>

      {/* Voice presets */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Quick presets</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {voicePresets.map((v) => (
            <button
              key={v.label}
              onClick={() =>
                updateProfile({
                  toneFormality: v.formality,
                  toneHumor: v.humor,
                  voiceDescription: v.desc,
                })
              }
              className={`text-left rounded-xl border p-4 transition-all hover:border-ig-pink/50 ${
                profile.toneFormality === v.formality &&
                profile.toneHumor === v.humor
                  ? "border-ig-pink bg-ig-pink/10"
                  : "border-border/40"
              }`}
            >
              <p className="font-medium text-sm">{v.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{v.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tone sliders */}
      <Card>
        <CardContent className="space-y-5 pt-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Casual</Label>
              <Label className="text-xs">Formal</Label>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={profile.toneFormality}
              onChange={(e) =>
                updateProfile({ toneFormality: Number(e.target.value) })
              }
              className="w-full accent-ig-pink"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Serious</Label>
              <Label className="text-xs">Playful</Label>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={profile.toneHumor}
              onChange={(e) =>
                updateProfile({ toneHumor: Number(e.target.value) })
              }
              className="w-full accent-ig-orange"
            />
          </div>
        </CardContent>
      </Card>

      {/* Voice description */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Describe your brand voice (optional)</Label>
        <textarea
          value={profile.voiceDescription}
          onChange={(e) => updateProfile({ voiceDescription: e.target.value })}
          placeholder="e.g. We speak like a knowledgeable friend — warm but backed by data. We use storytelling to explain complex topics."
          rows={3}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
        />
      </div>

      {/* Sample captions */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">
            Paste your best captions (3-10 recommended)
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            AI learns your voice from these examples. More = better style matching.
          </p>
        </div>
        <div className="space-y-2">
          {(profile.sampleCaptions.length === 0 ? [""] : profile.sampleCaptions).map(
            (cap, i) => (
              <div key={i} className="flex gap-2">
                <textarea
                  value={cap}
                  onChange={(e) => {
                    const updated = [...profile.sampleCaptions];
                    if (updated.length === 0) updated.push("");
                    updated[i] = e.target.value;
                    updateProfile({ sampleCaptions: updated });
                  }}
                  placeholder={i === 0 ? "Paste your best-performing caption..." : "Paste another caption..."}
                  rows={2}
                  className="flex-1 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                />
                {profile.sampleCaptions.length > 1 && (
                  <button
                    onClick={() =>
                      updateProfile({
                        sampleCaptions: profile.sampleCaptions.filter((_, j) => j !== i),
                      })
                    }
                    className="self-start mt-2 text-muted-foreground/40 hover:text-rose-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          )}
        </div>
        {profile.sampleCaptions.length < 10 && (
          <button
            onClick={() =>
              updateProfile({
                sampleCaptions: [
                  ...(profile.sampleCaptions.length === 0 ? [] : profile.sampleCaptions),
                  "",
                ],
              })
            }
            className="text-xs text-ig-pink hover:text-ig-pink/80 font-medium flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add another caption
            {profile.sampleCaptions.filter((c) => c.trim()).length > 0 && (
              <span className="text-muted-foreground/60 ml-1">
                ({profile.sampleCaptions.filter((c) => c.trim()).length}/10)
              </span>
            )}
          </button>
        )}
      </div>

      {/* Brand hashtag */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Brand hashtag</Label>
        <Input
          value={profile.brandHashtag}
          onChange={(e) => updateProfile({ brandHashtag: e.target.value })}
          placeholder="#yourbrand"
        />
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={prevDiscoveryStep} size="lg">
          Back
        </Button>
        <Button onClick={nextDiscoveryStep} size="lg" className="px-12">
          Continue
        </Button>
      </div>
    </div>
  );
}
