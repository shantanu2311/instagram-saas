"use client";

import { create } from "zustand";

export interface BrandConfig {
  // Step 1: Niche
  niche: string;
  // Step 2: Visual identity
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeadline: string;
  fontBody: string;
  logoUrl: string;
  // Step 3: Voice
  toneFormality: number; // 0=casual, 100=formal
  toneHumor: number; // 0=serious, 100=playful
  voiceDescription: string;
  sampleCaption: string;
  // Step 4: Content strategy
  contentPillars: string[];
  postingDays: Record<string, string>; // "0"-"6" -> content type
  postsPerWeek: number;
  brandHashtag: string;
}

interface OnboardingState {
  step: number;
  brand: BrandConfig;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateBrand: (updates: Partial<BrandConfig>) => void;
  reset: () => void;
}

const defaultBrand: BrandConfig = {
  niche: "",
  primaryColor: "#8b5cf6",
  secondaryColor: "#ec4899",
  accentColor: "#f59e0b",
  fontHeadline: "Inter",
  fontBody: "Inter",
  logoUrl: "",
  toneFormality: 50,
  toneHumor: 50,
  voiceDescription: "",
  sampleCaption: "",
  contentPillars: [],
  postingDays: {
    "0": "education",
    "1": "fact",
    "2": "reel",
    "3": "education",
    "4": "reel",
    "5": "fact",
    "6": "engage",
  },
  postsPerWeek: 5,
  brandHashtag: "",
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 0,
  brand: { ...defaultBrand },
  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 3) })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
  updateBrand: (updates) =>
    set((s) => ({ brand: { ...s.brand, ...updates } })),
  reset: () => set({ step: 0, brand: { ...defaultBrand } }),
}));
