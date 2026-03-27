"use client";

import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fontOptions = [
  "Inter",
  "Playfair Display",
  "Poppins",
  "Montserrat",
  "Roboto",
  "Lora",
  "Raleway",
  "Oswald",
];

const presetPalettes = [
  { name: "Purple & Pink", primary: "#8b5cf6", secondary: "#ec4899", accent: "#f59e0b" },
  { name: "Ocean Blue", primary: "#3b82f6", secondary: "#06b6d4", accent: "#10b981" },
  { name: "Sunset", primary: "#f97316", secondary: "#ef4444", accent: "#fbbf24" },
  { name: "Forest", primary: "#22c55e", secondary: "#14b8a6", accent: "#84cc16" },
  { name: "Midnight", primary: "#6366f1", secondary: "#8b5cf6", accent: "#a78bfa" },
  { name: "Rose Gold", primary: "#e11d48", secondary: "#f43f5e", accent: "#fda4af" },
];

export function StepBrandVisual() {
  const { brand, updateBrand, nextStep, prevStep } = useOnboardingStore();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Brand identity</h2>
        <p className="text-muted-foreground">
          Set your colors and fonts. These will be used in all generated content.
        </p>
      </div>

      {/* Color presets */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Quick palettes</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {presetPalettes.map((p) => (
            <button
              key={p.name}
              onClick={() =>
                updateBrand({
                  primaryColor: p.primary,
                  secondaryColor: p.secondary,
                  accentColor: p.accent,
                })
              }
              className={`flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-ig-pink/50 ${
                brand.primaryColor === p.primary &&
                brand.secondaryColor === p.secondary
                  ? "border-ig-pink bg-ig-pink/10"
                  : "border-border/40"
              }`}
            >
              <div className="flex -space-x-1">
                <div
                  className="h-5 w-5 rounded-full ring-2 ring-background"
                  style={{ backgroundColor: p.primary }}
                />
                <div
                  className="h-5 w-5 rounded-full ring-2 ring-background"
                  style={{ backgroundColor: p.secondary }}
                />
                <div
                  className="h-5 w-5 rounded-full ring-2 ring-background"
                  style={{ backgroundColor: p.accent }}
                />
              </div>
              <span className="text-xs">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom colors */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Primary", key: "primaryColor" as const },
          { label: "Secondary", key: "secondaryColor" as const },
          { label: "Accent", key: "accentColor" as const },
        ].map((c) => (
          <div key={c.key} className="space-y-2">
            <Label className="text-xs">{c.label}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brand[c.key]}
                onChange={(e) => updateBrand({ [c.key]: e.target.value })}
                className="h-9 w-9 rounded-md border border-border cursor-pointer"
              />
              <Input
                value={brand[c.key]}
                onChange={(e) => updateBrand({ [c.key]: e.target.value })}
                className="text-xs font-mono h-9"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Fonts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Headline Font</Label>
          <select
            value={brand.fontHeadline}
            onChange={(e) => updateBrand({ fontHeadline: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {fontOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Body Font</Label>
          <select
            value={brand.fontBody}
            onChange={(e) => updateBrand({ fontBody: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {fontOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-border/40 p-6 space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Preview
        </p>
        <div
          className="rounded-lg p-6 text-center space-y-2"
          style={{
            background: `linear-gradient(135deg, ${brand.primaryColor}20, ${brand.secondaryColor}20)`,
            borderLeft: `4px solid ${brand.primaryColor}`,
          }}
        >
          <p
            className="text-lg font-bold"
            style={{
              fontFamily: brand.fontHeadline,
              color: brand.primaryColor,
            }}
          >
            Your Brand Headline
          </p>
          <p
            className="text-sm"
            style={{ fontFamily: brand.fontBody }}
          >
            This is how your body text will look in generated content.
          </p>
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: brand.accentColor }}
          >
            Accent Tag
          </span>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={nextStep} size="lg" className="px-12">
          Continue
        </Button>
      </div>
    </div>
  );
}
