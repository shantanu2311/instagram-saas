import Anthropic from "@anthropic-ai/sdk";

// Singleton client — reused across requests
let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY not set. Add it to frontend/.env to enable AI content generation."
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Model to use — Sonnet for fast generation, Opus for strategy
export const FAST_MODEL = "claude-sonnet-4-6" as const;
export const DEEP_MODEL = "claude-opus-4-6" as const;

// ---------- Shared types ----------

export interface BrandContext {
  niche: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  toneFormality: number; // 0-100
  toneHumor: number; // 0-100
  voiceDescription: string;
  sampleCaption: string;
  contentPillars: string[];
  brandHashtag: string;
}

export interface StrategyContext {
  brandPositioning?: { summary: string; keyMessages: string[] };
  contentPillars?: Array<{ name: string; percentage: number; rationale: string }>;
  toneAndVoice?: { doList: string[]; dontList: string[] };
  hashtagStrategy?: { branded: string[]; niche: string[]; trending: string[] };
}

export interface GenerateContentRequest {
  topic: string;
  pillar: string;
  contentType: "image" | "carousel" | "reel";
  style: string;
  brand: BrandContext;
  strategy?: StrategyContext | null;
}

export interface GenerateContentResult {
  headline: string;
  caption: string;
  hashtags: string[];
  quality_score: number;
  quality_criteria: {
    hook_strength: number;
    caption_quality: number;
    hashtag_relevance: number;
    cta_strength: number;
    brand_alignment: number;
  };
}

export interface GenerateStrategyRequest {
  accountType: "business" | "creator" | "personal";
  businessName: string;
  businessDescription: string;
  productService: string;
  targetDemographics: string[];
  targetLocation: string;
  targetAgeMin: number;
  targetAgeMax: number;
  competitors: string[];
  goals: string[];
  contentPreferences: string[];
  usp: string;
  keyDifferentiators: string[];
  painPoints: string[];
  brandPersonality: string[];
  postingHistory: string;
  ambition: string;
  monetizationGoal: string;
  instagramHandle: string;
}

export interface GenerateCalendarRequest {
  strategy: StrategyContext;
  brand: BrandContext;
  month: number; // 1-12
  year: number;
  postsPerWeek: number;
}

export { generateCaption } from "./caption-generator";
export { generateStrategy } from "./strategy-generator";
export { generateCalendar } from "./calendar-generator";
