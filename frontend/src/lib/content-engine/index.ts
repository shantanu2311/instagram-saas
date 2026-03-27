import Anthropic from "@anthropic-ai/sdk";
import { execFile } from "child_process";

// ---------- Mode detection ----------
// If ANTHROPIC_API_KEY is set → use API directly (deployed / pay-per-token)
// Otherwise → shell out to local `claude` CLI (uses Max subscription)

function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// Singleton API client — only used when API key is present
let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY not set. Add it to frontend/.env or use local Claude Code instead."
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Model to use — Sonnet for fast generation, Opus for strategy
export const FAST_MODEL = "claude-sonnet-4-6" as const;
export const DEEP_MODEL = "claude-opus-4-6" as const;

// ---------- Unified Claude caller ----------
// Works via API or local CLI — callers don't need to know which

interface CallClaudeOptions {
  system: string;
  userMessage: string;
  model?: "fast" | "deep";
  maxTokens?: number;
}

/**
 * Call Claude via API (if key is set) or local `claude` CLI (Max subscription).
 * Returns the raw text response.
 */
export async function callClaude(opts: CallClaudeOptions): Promise<string> {
  if (hasApiKey()) {
    return callClaudeApi(opts);
  }
  return callClaudeCli(opts);
}

async function callClaudeApi(opts: CallClaudeOptions): Promise<string> {
  const c = getClient();
  const model = opts.model === "deep" ? DEEP_MODEL : FAST_MODEL;

  const response = await c.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: "user", content: opts.userMessage }],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

async function callClaudeCli(opts: CallClaudeOptions): Promise<string> {
  // Combine system + user into a single prompt for the CLI
  const fullPrompt = `${opts.system}\n\n---\n\n${opts.userMessage}`;
  const model = opts.model === "deep" ? DEEP_MODEL : FAST_MODEL;

  return new Promise((resolve, reject) => {
    const child = execFile(
      "claude",
      ["-p", fullPrompt, "--model", model, "--output-format", "text"],
      {
        maxBuffer: 1024 * 1024, // 1MB
        timeout: 120_000, // 2 min
        env: { ...process.env },
      },
      (error, stdout, stderr) => {
        if (error) {
          // If claude CLI not found, give a helpful message
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            reject(
              new Error(
                "Claude CLI not found. Install Claude Code (https://claude.ai/claude-code) or set ANTHROPIC_API_KEY for API mode."
              )
            );
            return;
          }
          reject(new Error(`Claude CLI error: ${stderr || error.message}`));
          return;
        }
        resolve(stdout);
      }
    );

    // Write nothing to stdin, just let it run
    child.stdin?.end();
  });
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
