"use client";

import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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

export function StepVoice() {
  const { brand, updateBrand, nextStep, prevStep } = useOnboardingStore();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Brand voice</h2>
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
                updateBrand({
                  toneFormality: v.formality,
                  toneHumor: v.humor,
                  voiceDescription: v.desc,
                })
              }
              className={`text-left rounded-xl border p-4 transition-all hover:border-ig-pink/50 ${
                brand.toneFormality === v.formality &&
                brand.toneHumor === v.humor
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
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Casual</Label>
            <Label className="text-xs">Formal</Label>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={brand.toneFormality}
            onChange={(e) =>
              updateBrand({ toneFormality: Number(e.target.value) })
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
            value={brand.toneHumor}
            onChange={(e) =>
              updateBrand({ toneHumor: Number(e.target.value) })
            }
            className="w-full accent-ig-orange"
          />
        </div>
      </div>

      {/* Voice description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Describe your brand voice (optional)
        </Label>
        <textarea
          value={brand.voiceDescription}
          onChange={(e) => updateBrand({ voiceDescription: e.target.value })}
          placeholder="e.g. We speak like a knowledgeable friend — warm but backed by data. We use storytelling to explain complex topics. Light humor is ok but never sarcastic."
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Few-shot voice examples */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">
            Paste your best captions (3–10 recommended)
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            AI learns your voice from these examples. More examples = better
            style matching.
          </p>
        </div>
        <div className="space-y-2">
          {(brand.sampleCaptions.length === 0 ? [""] : brand.sampleCaptions).map(
            (cap, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground/60 font-mono">
                    {i + 1}.
                  </span>
                  <textarea
                    value={cap}
                    onChange={(e) => {
                      const updated = [...brand.sampleCaptions];
                      if (updated.length === 0) updated.push("");
                      updated[i] = e.target.value;
                      updateBrand({ sampleCaptions: updated });
                    }}
                    placeholder={
                      i === 0
                        ? "Paste your best-performing caption here..."
                        : "Paste another caption..."
                    }
                    rows={2}
                    className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                {brand.sampleCaptions.length > 1 && (
                  <button
                    onClick={() => {
                      const updated = brand.sampleCaptions.filter(
                        (_, j) => j !== i
                      );
                      updateBrand({ sampleCaptions: updated });
                    }}
                    className="self-start mt-2 text-muted-foreground/40 hover:text-rose-500 transition-colors"
                    title="Remove"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            )
          )}
        </div>
        {brand.sampleCaptions.length < 10 && (
          <button
            onClick={() =>
              updateBrand({
                sampleCaptions: [
                  ...(brand.sampleCaptions.length === 0
                    ? []
                    : brand.sampleCaptions),
                  "",
                ],
              })
            }
            className="text-xs text-ig-pink hover:text-ig-pink/80 font-medium flex items-center gap-1"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add another caption
            {brand.sampleCaptions.filter((c) => c.trim()).length > 0 && (
              <span className="text-muted-foreground/60 ml-1">
                ({brand.sampleCaptions.filter((c) => c.trim()).length}/10)
              </span>
            )}
          </button>
        )}
      </div>

      {/* Brand hashtag */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Brand hashtag</Label>
        <Input
          value={brand.brandHashtag}
          onChange={(e) => updateBrand({ brandHashtag: e.target.value })}
          placeholder="#yourbrand"
        />
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={prevStep}>
          Back
        </Button>
        <Button
          onClick={nextStep}
          disabled={!brand.voiceDescription}
          size="lg"
          className="px-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
