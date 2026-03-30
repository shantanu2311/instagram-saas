"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccountType = "business" | "creator" | "personal";

export interface BusinessProfile {
  accountType: AccountType;
  businessName: string; // Also used as creator name / personal name
  businessDescription: string; // Also: what you create / what you're about
  productService: string; // Also: niche/expertise / interests
  niche: string; // Industry/niche category
  websiteUrl: string;
  // Creator/personal-specific
  instagramHandle: string;
  ambition: string; // Where do you want to be in 6 months? What does success look like?
  monetizationGoal: string; // How do you want to monetize (if at all)?
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
  // Brand identity (visual)
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontHeadline: string;
  fontBody: string;
  logoUrl: string;
  // Brand voice
  toneFormality: number; // 0=casual, 100=formal
  toneHumor: number; // 0=serious, 100=playful
  voiceDescription: string;
  sampleCaptions: string[];
  brandHashtag: string;
}

export interface CompetitorData {
  handle: string;
  name?: string;
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
  hookFormulas?: Array<{
    template: string;
    example: string;
    type: string;
  }>;
  reelStructures?: Array<{
    name: string;
    duration: string;
    sections: Array<{
      label: string;
      duration: string;
      instruction: string;
    }>;
    faceless: boolean;
  }>;
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
  startDate?: string;
  endDate?: string;
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
  /** Persist current calendar slots to the database */
  persistCalendar: (brandId: string) => Promise<boolean>;
  reset: () => void;
}

const defaultProfile: BusinessProfile = {
  accountType: "business",
  businessName: "",
  businessDescription: "",
  productService: "",
  niche: "",
  websiteUrl: "",
  instagramHandle: "",
  ambition: "",
  monetizationGoal: "",
  targetAgeMin: 18,
  targetAgeMax: 45,
  targetDemographics: [],
  targetLocation: "",
  targetGender: "all",
  competitors: [],
  goals: [],
  contentPreferences: [],
  postingHistory: "",
  budgetTier: "free",
  usp: "",
  keyDifferentiators: [],
  painPoints: [],
  brandPersonality: [],
  // Brand identity defaults
  primaryColor: "#8b5cf6",
  secondaryColor: "#ec4899",
  accentColor: "#f59e0b",
  backgroundColor: "#ffffff",
  textColor: "#1a1a1a",
  fontHeadline: "Inter",
  fontBody: "Inter",
  logoUrl: "",
  // Brand voice defaults
  toneFormality: 50,
  toneHumor: 50,
  voiceDescription: "",
  sampleCaptions: [],
  brandHashtag: "",
};

export const useStrategyStore = create<StrategyState>()(
  persist(
    (set, get) => ({
      discoveryStep: 0,
      profile: { ...defaultProfile },
      researchStatus: "idle",
      researchProgress: 0,
      researchResults: null,
      strategy: null,
      calendar: null,

      setDiscoveryStep: (step) => set({ discoveryStep: step }),
      nextDiscoveryStep: () =>
        set((s) => ({ discoveryStep: Math.min(s.discoveryStep + 1, 11) })),
      prevDiscoveryStep: () =>
        set((s) => ({ discoveryStep: Math.max(s.discoveryStep - 1, 0) })),
      updateProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),
      setResearchStatus: (status) => set({ researchStatus: status }),
      setResearchProgress: (progress) => set({ researchProgress: progress }),
      setResearchResults: (results) => set({ researchResults: results }),
      setStrategy: (strategy) => set({ strategy }),
      setCalendar: (calendar) => set({ calendar }),
      persistCalendar: async (brandId: string) => {
        const { calendar } = get();
        if (!calendar?.slots?.length) return false;
        try {
          const res = await fetch("/api/calendar/persist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brandId, slots: calendar.slots }),
          });
          return res.ok;
        } catch {
          console.error("Failed to persist calendar to DB");
          return false;
        }
      },
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
      merge: (persisted, current) => {
        const state = persisted as Partial<StrategyState>;
        return {
          ...current,
          ...state,
          profile: { ...(current as StrategyState).profile, ...state?.profile },
        };
      },
    }
  )
);
