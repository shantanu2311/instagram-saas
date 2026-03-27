"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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

export interface CompetitorData {
  handle: string;
  followers: number;
  engagementRate: number;
  postingFrequency: string;
  topContentTypes: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
}

export interface TrendData {
  hashtags: string[];
  viralExamples: Array<{
    type: string;
    topic: string;
    views: string;
  }>;
  trendingFormats: Array<{
    name: string;
    growth: string;
  }>;
}

export interface StrategyInsight {
  text: string;
  confidence: number;
  actionable: boolean;
}

export interface ResearchResults {
  competitors: CompetitorData[];
  trends: TrendData;
  insights: StrategyInsight[];
}

export interface ContentStrategy {
  id: string;
  status: string;
  mock?: boolean;
  brandPositioning: {
    summary: string;
    keyMessages: string[];
  };
  contentPillars: Array<{
    name: string;
    percentage: number;
    rationale: string;
    examples: string[];
  }>;
  postingCadence: {
    postsPerWeek: number;
    bestTimes: string[];
    schedule: Record<string, string>;
  };
  toneAndVoice: {
    doList: string[];
    dontList: string[];
    sampleCaptions: string[];
  };
  hashtagStrategy: {
    branded: string[];
    niche: string[];
    trending: string[];
  };
  contentFormats: {
    reels: number;
    carousels: number;
    images: number;
  };
  growthTactics: Array<{
    name: string;
    impact: string;
    description: string;
  }>;
  milestones: {
    day30: { followers: string; engagement: string; posts: number };
    day60: { followers: string; engagement: string; posts: number };
    day90: { followers: string; engagement: string; posts: number };
  };
}

export interface CalendarSlot {
  date: string;
  day: number;
  dayOfWeek: string;
  pillar: string;
  contentType: string;
  topic: string;
  headline: string;
  suggestedTime: string;
  isTrendBased: boolean;
}

export interface ContentCalendar {
  id: string;
  mock?: boolean;
  month: number;
  year: number;
  slots: CalendarSlot[];
}

interface StrategyState {
  discoveryStep: number;
  profile: BusinessProfile;
  researchStatus: "idle" | "running" | "complete" | "error";
  researchProgress: number;
  researchResults: ResearchResults | null;
  strategy: ContentStrategy | null;
  calendar: ContentCalendar | null;
  // Actions
  setDiscoveryStep: (step: number) => void;
  nextDiscoveryStep: () => void;
  prevDiscoveryStep: () => void;
  updateProfile: (updates: Partial<BusinessProfile>) => void;
  setResearchStatus: (status: "idle" | "running" | "complete" | "error") => void;
  setResearchProgress: (progress: number) => void;
  setResearchResults: (results: ResearchResults | null) => void;
  setStrategy: (strategy: ContentStrategy | null) => void;
  setCalendar: (calendar: ContentCalendar | null) => void;
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

export const useStrategyStore = create<StrategyState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "igcreator-strategy",
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const val = sessionStorage.getItem(name);
          return val ? JSON.parse(val) : null;
        },
        setItem: (name, value) => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(name);
          }
        },
      },
    }
  )
);
