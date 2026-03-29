"use client";

import { useState } from "react";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Palette, Globe, Loader2, Sparkles, Upload } from "lucide-react";

const fontOptions = [
  "Inter",
  "Playfair Display",
  "Poppins",
  "Montserrat",
  "Roboto",
  "Lora",
  "Raleway",
  "Oswald",
  "DM Sans",
  "Space Grotesk",
  "Merriweather",
  "Nunito",
  "Cabin",
  "Work Sans",
  "Manrope",
  "Plus Jakarta Sans",
];

const presetPalettes = [
  { name: "Purple & Pink", primary: "#8b5cf6", secondary: "#ec4899", accent: "#f59e0b" },
  { name: "Ocean Blue", primary: "#3b82f6", secondary: "#06b6d4", accent: "#10b981" },
  { name: "Sunset", primary: "#f97316", secondary: "#ef4444", accent: "#fbbf24" },
  { name: "Forest", primary: "#22c55e", secondary: "#14b8a6", accent: "#84cc16" },
  { name: "Midnight", primary: "#6366f1", secondary: "#8b5cf6", accent: "#a78bfa" },
  { name: "Rose Gold", primary: "#e11d48", secondary: "#f43f5e", accent: "#fda4af" },
  { name: "Monochrome", primary: "#1a1a1a", secondary: "#4a4a4a", accent: "#f59e0b" },
  { name: "Coral", primary: "#f472b6", secondary: "#fb923c", accent: "#fbbf24" },
];

export function DiscoveryStepBrandIdentity() {
  const { profile, updateProfile, nextDiscoveryStep, prevDiscoveryStep } =
    useStrategyStore();
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [extractError, setExtractError] = useState("");

  const handleExtractFromWebsite = async () => {
    if (!profile.websiteUrl.trim()) return;
    setExtracting(true);
    setExtractError("");
    setExtracted(false);

    try {
      const res = await fetch("/api/strategy/scrape-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: profile.websiteUrl, extractBrand: true }),
      });
      const data = await res.json();

      if (!res.ok) {
        setExtractError(data.error || "Could not fetch website");
        return;
      }

      // Apply extracted brand colors/fonts if available
      const updates: Partial<typeof profile> = {};
      if (data.brandColors?.primary) updates.primaryColor = data.brandColors.primary;
      if (data.brandColors?.secondary) updates.secondaryColor = data.brandColors.secondary;
      if (data.brandColors?.accent) updates.accentColor = data.brandColors.accent;
      if (data.brandColors?.background) updates.backgroundColor = data.brandColors.background;
      if (data.brandColors?.text) updates.textColor = data.brandColors.text;
      if (data.brandFonts?.headline) updates.fontHeadline = data.brandFonts.headline;
      if (data.brandFonts?.body) updates.fontBody = data.brandFonts.body;

      if (Object.keys(updates).length > 0) {
        updateProfile(updates);
        setExtracted(true);
      } else {
        setExtractError("No brand colors or fonts found on the website.");
      }
    } catch {
      setExtractError("Failed to extract brand info from website.");
    } finally {
      setExtracting(false);
    }
  };

  const colorFields = [
    { label: "Primary", key: "primaryColor" as const },
    { label: "Secondary", key: "secondaryColor" as const },
    { label: "Accent", key: "accentColor" as const },
    { label: "Background", key: "backgroundColor" as const },
    { label: "Text", key: "textColor" as const },
  ];

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center mb-4">
          <Palette className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Brand Identity</h2>
        <p className="text-muted-foreground">
          Set your brand colors, fonts, and logo. These will be used in all generated content.
        </p>
      </div>

      {/* Auto-extract from website */}
      {profile.websiteUrl && (
        <Card>
          <CardContent className="pt-2">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Auto-detect from website</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {profile.websiteUrl}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExtractFromWebsite}
                disabled={extracting}
                className="gap-1.5 shrink-0 ml-3"
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Detecting...
                  </>
                ) : extracted ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    Applied
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5" />
                    Extract Colors & Fonts
                  </>
                )}
              </Button>
            </div>
            {extractError && (
              <p className="text-xs text-amber-500 mt-2">{extractError}</p>
            )}
            {extracted && (
              <p className="text-xs text-emerald-500 mt-2">
                Colors and fonts detected. Review and adjust below.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Color presets */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Quick palettes</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {presetPalettes.map((p) => (
            <button
              key={p.name}
              onClick={() =>
                updateProfile({
                  primaryColor: p.primary,
                  secondaryColor: p.secondary,
                  accentColor: p.accent,
                })
              }
              className={`flex items-center gap-2 rounded-lg border p-2.5 transition-all hover:border-ig-pink/50 ${
                profile.primaryColor === p.primary &&
                profile.secondaryColor === p.secondary
                  ? "border-ig-pink bg-ig-pink/10"
                  : "border-border/40"
              }`}
            >
              <div className="flex -space-x-1">
                <div
                  className="h-4 w-4 rounded-full ring-2 ring-background"
                  style={{ backgroundColor: p.primary }}
                />
                <div
                  className="h-4 w-4 rounded-full ring-2 ring-background"
                  style={{ backgroundColor: p.secondary }}
                />
                <div
                  className="h-4 w-4 rounded-full ring-2 ring-background"
                  style={{ backgroundColor: p.accent }}
                />
              </div>
              <span className="text-[11px] truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom colors */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Custom colors</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {colorFields.map((c) => (
            <div key={c.key} className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">{c.label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={profile[c.key]}
                  onChange={(e) => updateProfile({ [c.key]: e.target.value })}
                  className="h-8 w-8 rounded-md border border-border cursor-pointer shrink-0"
                />
                <Input
                  value={profile[c.key]}
                  onChange={(e) => updateProfile({ [c.key]: e.target.value })}
                  className="text-xs font-mono h-8"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div className="grid grid-cols-2 gap-4">
        {(["fontHeadline", "fontBody"] as const).map((key) => {
          const label = key === "fontHeadline" ? "Headline Font" : "Body Font";
          const value = profile[key];
          // Include AI-detected font if it's not in the preset list
          const options = fontOptions.includes(value)
            ? fontOptions
            : [value, ...fontOptions];
          return (
            <div key={key} className="space-y-1.5">
              <Label className="text-sm font-medium">{label}</Label>
              <select
                value={value}
                onChange={(e) => updateProfile({ [key]: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {options.map((f) => (
                  <option key={f} value={f}>
                    {f}{!fontOptions.includes(f) ? " (detected)" : ""}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Logo upload */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Brand Logo (optional)</Label>
        <div
          className="border-2 border-dashed border-border/40 rounded-lg p-4 text-center hover:border-ig-pink/40 hover:bg-ig-pink/5 transition-colors cursor-pointer"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/png,image/jpeg,image/svg+xml,image/webp";
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file || file.size > 2 * 1024 * 1024) return;
              const reader = new FileReader();
              reader.onload = () => {
                updateProfile({ logoUrl: reader.result as string });
              };
              reader.readAsDataURL(file);
            };
            input.click();
          }}
        >
          {profile.logoUrl ? (
            <div className="flex items-center justify-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.logoUrl}
                alt="Logo"
                className="h-12 w-12 object-contain rounded"
              />
              <span className="text-xs text-muted-foreground">Click to change</span>
            </div>
          ) : (
            <>
              <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">
                Upload PNG, JPG, or SVG (max 2MB)
              </p>
            </>
          )}
        </div>
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
