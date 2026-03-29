"use client";

import { useState, useEffect } from "react";

export interface BrandData {
  id: string;
  name: string;
  niche: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  fontHeadline: string;
  fontBody: string;
  toneFormality: number;
  toneHumor: number;
  voiceDescription: string | null;
  sampleCaption: string | null;
  contentPillars: string[];
  postingDays: Record<string, string>;
  postsPerWeek: number;
  hashtagSets: unknown;
  brandHashtag: string | null;
}

const defaultBrand: BrandData = {
  id: "",
  name: "",
  niche: "",
  primaryColor: "#8b5cf6",
  secondaryColor: "#ec4899",
  accentColor: "#f59e0b",
  logoUrl: null,
  fontHeadline: "Inter",
  fontBody: "Inter",
  toneFormality: 50,
  toneHumor: 50,
  voiceDescription: null,
  sampleCaption: null,
  contentPillars: [],
  postingDays: {},
  postsPerWeek: 5,
  hashtagSets: null,
  brandHashtag: null,
};

/**
 * Hook to fetch brand data from the database.
 * Replaces useOnboardingStore for reading brand config.
 */
export function useBrand() {
  const [brand, setBrand] = useState<BrandData>(defaultBrand);
  const [loading, setLoading] = useState(true);
  const [hasBrand, setHasBrand] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/brands");
        if (!res.ok) { if (mounted) setLoading(false); return; }
        const data = await res.json();
        // GET /api/brands returns a flat array or { brands: [] }
        const arr = Array.isArray(data) ? data : data?.brands;
        const b = arr?.[0];
        if (mounted && b) {
          setBrand({
            id: b.id,
            name: b.name || "",
            niche: b.niche || "",
            primaryColor: b.primaryColor || "#8b5cf6",
            secondaryColor: b.secondaryColor || "#ec4899",
            accentColor: b.accentColor || "#f59e0b",
            logoUrl: b.logoUrl || null,
            fontHeadline: b.fontHeadline || "Inter",
            fontBody: b.fontBody || "Inter",
            toneFormality: b.toneFormality ?? 50,
            toneHumor: b.toneHumor ?? 50,
            voiceDescription: b.voiceDescription || null,
            sampleCaption: b.sampleCaption || null,
            contentPillars: Array.isArray(b.contentPillars) ? b.contentPillars : [],
            postingDays: b.postingDays || {},
            postsPerWeek: b.postsPerWeek || 5,
            hashtagSets: b.hashtagSets || null,
            brandHashtag: b.brandHashtag || null,
          });
          setHasBrand(true);
        }
      } catch {
        // Ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { brand, loading, hasBrand };
}
