"use client";

import { create } from "zustand";

export interface BusinessProfile {
  businessName: string;
  businessDescription: string;
  productService: string;
  websiteUrl: string;
  targetAgeMin: number;
  targetAgeMax: number;
  targetDemographics: string[];
  targetLocation: string;
  targetGender: string;
  competitors: string[];
  goals: string[];
  contentPreferences: string[];
  postingHistory: string;
  budgetTier: string;
  usp: string;
  keyDifferentiators: string[];
  painPoints: string[];
  brandPersonality: string[];
}

interface StrategyState {
  discoveryStep: number;
  profile: BusinessProfile;
  researchStatus: "idle" | "running" | "complete" | "error";
  researchProgress: number;
  researchResults: any | null;
  strategy: any | null;
  calendar: any | null;
  // Actions
  setDiscoveryStep: (step: number) => void;
  nextDiscoveryStep: () => void;
  prevDiscoveryStep: () => void;
  updateProfile: (updates: Partial<BusinessProfile>) => void;
  setResearchStatus: (status: "idle" | "running" | "complete" | "error") => void;
  setResearchProgress: (progress: number) => void;
  setResearchResults: (results: any) => void;
  setStrategy: (strategy: any) => void;
  setCalendar: (calendar: any) => void;
  reset: () => void;
}

const defaultProfile: BusinessProfile = {
  businessName: "",
  businessDescription: "",
  productService: "",
  websiteUrl: "",
  targetAgeMin: 18,
  targetAgeMax: 45,
  targetDemographics: [],
  targetLocation: "",
  targetGender: "all",
  competitors: [],
  goals: [],
  contentPreferences: [],
  postingHistory: "new",
  budgetTier: "free",
  usp: "",
  keyDifferentiators: [],
  painPoints: [],
  brandPersonality: [],
};

export const useStrategyStore = create<StrategyState>((set) => ({
  discoveryStep: 0,
  profile: { ...defaultProfile },
  researchStatus: "idle",
  researchProgress: 0,
  researchResults: null,
  strategy: null,
  calendar: null,

  setDiscoveryStep: (step) => set({ discoveryStep: step }),
  nextDiscoveryStep: () =>
    set((s) => ({ discoveryStep: Math.min(s.discoveryStep + 1, 7) })),
  prevDiscoveryStep: () =>
    set((s) => ({ discoveryStep: Math.max(s.discoveryStep - 1, 0) })),
  updateProfile: (updates) =>
    set((s) => ({ profile: { ...s.profile, ...updates } })),
  setResearchStatus: (status) => set({ researchStatus: status }),
  setResearchProgress: (progress) => set({ researchProgress: progress }),
  setResearchResults: (results) => set({ researchResults: results }),
  setStrategy: (strategy) => set({ strategy }),
  setCalendar: (calendar) => set({ calendar }),
  reset: () =>
    set({
      discoveryStep: 0,
      profile: { ...defaultProfile },
      researchStatus: "idle",
      researchProgress: 0,
      researchResults: null,
      strategy: null,
      calendar: null,
    }),
}));
