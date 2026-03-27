"use client";

import { useState } from "react";
import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Mic2, User, Globe, Loader2, Sparkles } from "lucide-react";

const fieldConfig = {
  business: {
    icon: Building2,
    title: "Tell us about your business",
    subtitle: "This helps us understand your brand and create relevant content.",
    nameLabel: "Business Name",
    namePlaceholder: "e.g., Acme Fitness Co.",
    descLabel: "Business Description",
    descPlaceholder: "What does your business do? Who do you serve?",
    offeringLabel: "Product / Service",
    offeringPlaceholder: "Describe your main product or service offering",
    showWebsite: true,
    showHandle: false,
    websiteFirst: true, // Show website field at top for business
  },
  creator: {
    icon: Mic2,
    title: "Tell us about you",
    subtitle: "Help us understand your creator identity and what you're building.",
    nameLabel: "Your Name / Brand",
    namePlaceholder: "e.g., Sarah Fitness, The Cooking Nerd",
    descLabel: "What do you create?",
    descPlaceholder: "What kind of content do you make? What are you known for or want to be known for?",
    offeringLabel: "Your Niche / Expertise",
    offeringPlaceholder: "e.g., Home workouts for busy moms, Budget travel tips, Watercolor tutorials",
    showWebsite: true,
    showHandle: true,
    websiteFirst: false,
  },
  personal: {
    icon: User,
    title: "Tell us about yourself",
    subtitle: "Help us understand what you want your Instagram to be about.",
    nameLabel: "Your Name",
    namePlaceholder: "e.g., Alex Johnson",
    descLabel: "What are you about?",
    descPlaceholder: "What drives you? What do you want people to know about you?",
    offeringLabel: "Interests / Passions",
    offeringPlaceholder: "e.g., Photography, hiking, cooking, personal finance, fashion",
    showWebsite: false,
    showHandle: true,
    websiteFirst: false,
  },
};

export function DiscoveryStepBusiness() {
  const { profile, updateProfile, nextDiscoveryStep, prevDiscoveryStep } =
    useStrategyStore();
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState(false);
  const [scrapeError, setScrapeError] = useState("");

  const config = fieldConfig[profile.accountType] || fieldConfig.business;
  const Icon = config.icon;

  const canContinue =
    profile.businessName.trim() !== "" &&
    profile.businessDescription.trim() !== "";

  const handleScrapeWebsite = async () => {
    if (!profile.websiteUrl.trim()) return;
    setScraping(true);
    setScrapeError("");
    setScraped(false);

    try {
      const res = await fetch("/api/strategy/scrape-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: profile.websiteUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        setScrapeError(data.error || "Could not fetch website");
        return;
      }

      // Prepopulate fields with scraped data (only fill empty fields)
      const updates: Record<string, string> = {};
      if (!profile.businessName.trim() && data.businessName) {
        updates.businessName = data.businessName;
      }
      if (!profile.businessDescription.trim() && data.businessDescription) {
        updates.businessDescription = data.businessDescription;
      }
      if (!profile.productService.trim() && data.productService) {
        updates.productService = data.productService;
      }
      if (!profile.usp.trim() && data.usp) {
        updates.usp = data.usp;
      }
      if (data.url) {
        updates.websiteUrl = data.url;
      }

      if (Object.keys(updates).length > 0) {
        updateProfile(updates);
      }
      setScraped(true);
    } catch {
      setScrapeError("Failed to analyze website. You can fill in the fields manually.");
    } finally {
      setScraping(false);
    }
  };

  const textareaClass =
    "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none";

  const websiteField = config.showWebsite && (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {profile.accountType === "creator"
          ? "Website / Link in Bio"
          : "Website URL"}
      </label>
      <div className="flex gap-2">
        <Input
          value={profile.websiteUrl}
          onChange={(e) => {
            updateProfile({ websiteUrl: e.target.value });
            setScraped(false);
            setScrapeError("");
          }}
          placeholder="https://example.com"
          className="flex-1"
        />
        {profile.accountType === "business" && (
          <Button
            variant="outline"
            size="default"
            onClick={handleScrapeWebsite}
            disabled={scraping || !profile.websiteUrl.trim()}
            className="gap-1.5 shrink-0"
          >
            {scraping ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analyzing...
              </>
            ) : scraped ? (
              <>
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                Done
              </>
            ) : (
              <>
                <Globe className="h-3.5 w-3.5" />
                Auto-fill
              </>
            )}
          </Button>
        )}
      </div>
      {scrapeError && (
        <p className="text-xs text-destructive">{scrapeError}</p>
      )}
      {scraped && (
        <p className="text-xs text-emerald-500">
          Fields populated from your website. Review and edit as needed.
        </p>
      )}
      {profile.accountType === "business" && !scraped && !scraping && (
        <p className="text-[11px] text-muted-foreground">
          Enter your website URL and click Auto-fill to pre-populate your business details.
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">{config.title}</h2>
        <p className="text-muted-foreground">{config.subtitle}</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-2">
          {/* For business: show website first so they can auto-fill */}
          {config.websiteFirst && websiteField}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{config.nameLabel}</label>
            <Input
              value={profile.businessName}
              onChange={(e) =>
                updateProfile({ businessName: e.target.value })
              }
              placeholder={config.namePlaceholder}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{config.descLabel}</label>
            <textarea
              value={profile.businessDescription}
              onChange={(e) =>
                updateProfile({ businessDescription: e.target.value })
              }
              placeholder={config.descPlaceholder}
              rows={3}
              className={textareaClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{config.offeringLabel}</label>
            <textarea
              value={profile.productService}
              onChange={(e) =>
                updateProfile({ productService: e.target.value })
              }
              placeholder={config.offeringPlaceholder}
              rows={2}
              className={textareaClass}
            />
          </div>

          {config.showHandle && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Instagram Handle</label>
              <Input
                value={profile.instagramHandle}
                onChange={(e) =>
                  updateProfile({ instagramHandle: e.target.value })
                }
                placeholder="@yourhandle"
              />
            </div>
          )}

          {/* For non-business: show website at bottom */}
          {!config.websiteFirst && websiteField}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={prevDiscoveryStep} size="lg">
          Back
        </Button>
        <Button
          onClick={nextDiscoveryStep}
          disabled={!canContinue}
          size="lg"
          className="px-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
