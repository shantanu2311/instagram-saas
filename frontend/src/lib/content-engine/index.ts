import OpenAI from "openai";

// ---------- Mode detection ----------
// Priority: OPENAI_API_KEY → ANTHROPIC_API_KEY → Claude CLI

function hasOpenAiKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// Singleton OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAiClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not set. Add it to frontend/.env");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Model mapping
export const FAST_MODEL = "gpt-4o-mini" as const;
export const DEEP_MODEL = "gpt-4o-mini" as const;

// ---------- Unified caller ----------

interface CallClaudeOptions {
  system: string;
  userMessage: string;
  model?: "fast" | "deep";
  maxTokens?: number;
  webSearch?: boolean;
}

/**
 * Call AI via OpenAI API.
 * Returns the raw text response.
 * Named `callClaude` for backward compatibility with all generators.
 */
export async function callClaude(opts: CallClaudeOptions): Promise<string> {
  if (!hasOpenAiKey()) {
    throw new Error(
      "OPENAI_API_KEY not set. Add it to frontend/.env to enable AI features."
    );
  }
  return callOpenAi(opts);
}

async function callOpenAi(opts: CallClaudeOptions): Promise<string> {
  const client = getOpenAiClient();
  const model = opts.model === "deep" ? DEEP_MODEL : FAST_MODEL;

  const response = await client.chat.completions.create({
    model,
    max_tokens: opts.maxTokens ?? 4096,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.userMessage },
    ],
  });

  return response.choices[0]?.message?.content || "";
}

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
  sampleCaptions: string[];
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
  deepDiveAnswers?: Array<{ question: string; answer: string }>;
  researchResults?: {
    competitors?: Array<{
      handle: string;
      name?: string;
      followers: number;
      engagementRate: number;
      postingFrequency: string;
      strengths: string[];
      weaknesses: string[];
    }>;
    trends?: {
      hashtags: string[];
      viralExamples: Array<{ type: string; topic: string; views: string }>;
      trendingFormats: Array<{ name: string; growth: string }>;
    };
    insights?: Array<{ text: string; confidence: number }>;
  };
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
export { repurposeContent } from "./repurpose-generator";
export { generateReelScript } from "./reel-script-generator";
export { researchHashtags } from "./hashtag-generator";
export { generateResearch } from "./research-generator";
