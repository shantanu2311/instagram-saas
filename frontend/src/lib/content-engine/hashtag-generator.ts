import { callClaude, type BrandContext, type StrategyContext } from "./index";

export interface HashtagResearchRequest {
  topic: string;
  brand: BrandContext;
  strategy?: StrategyContext | null;
}

export interface HashtagSet {
  category: string;
  tags: Array<{
    tag: string;
    reach: "high" | "medium" | "niche";
    competition: "high" | "medium" | "low";
  }>;
}

export interface HashtagResearchResult {
  sets: HashtagSet[];
  recommended: string[];
  banned: string[];
  tip: string;
}

function buildSystemPrompt(req: HashtagResearchRequest): string {
  const hasStrategy = req.strategy?.hashtagStrategy;

  let prompt = `You are an Instagram hashtag strategist specializing in 2026 algorithm optimization. You understand how Instagram's Explore page, hashtag following, and content distribution work.

BRAND CONTEXT:
- Niche: ${req.brand.niche || "general"}
- Brand: ${req.brand.brandName || "growing brand"}
- Content pillars: ${req.brand.contentPillars.length > 0 ? req.brand.contentPillars.join(", ") : "education, entertainment, engagement"}
${req.brand.brandHashtag ? `- Brand hashtag: ${req.brand.brandHashtag}` : ""}`;

  if (hasStrategy) {
    const h = req.strategy!.hashtagStrategy!;
    prompt += `\n\nEXISTING HASHTAG STRATEGY:`;
    if (h.branded?.length) prompt += `\n- Branded: ${h.branded.join(" ")}`;
    if (h.niche?.length) prompt += `\n- Niche: ${h.niche.join(" ")}`;
    if (h.trending?.length) prompt += `\n- Trending: ${h.trending.join(" ")}`;
  }

  prompt += `\n\nRESEARCH TASK:
Analyze the topic and generate a comprehensive hashtag strategy with 4 categories:
1. **Branded** (2-3 tags) — unique to this brand/account
2. **Niche** (5-8 tags) — specific to the topic and industry, medium competition
3. **Reach** (5-8 tags) — broader tags for discovery, higher competition
4. **Trending** (3-5 tags) — currently trending or seasonal tags

For each tag, estimate:
- reach: "high" (>1M posts), "medium" (100K-1M), "niche" (<100K)
- competition: "high", "medium", "low"

Also provide:
- A recommended set of 12-15 tags for this specific post (the optimal mix)
- Tags to avoid (banned/shadowbanned/overused)
- One tactical tip specific to this niche

Return ONLY valid JSON:
{
  "sets": [
    {
      "category": "Branded|Niche|Reach|Trending",
      "tags": [
        { "tag": "#example", "reach": "medium", "competition": "low" }
      ]
    }
  ],
  "recommended": ["#tag1", "#tag2", ...],
  "banned": ["#tag1", "#tag2"],
  "tip": "One tactical hashtag tip for this niche"
}`;

  return prompt;
}

export async function researchHashtags(
  req: HashtagResearchRequest
): Promise<HashtagResearchResult> {
  const text = await callClaude({
    system: buildSystemPrompt(req),
    userMessage: `Research Instagram hashtags for this topic: ${req.topic}`,
    model: "fast",
    maxTokens: 2048,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse hashtag research response");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("Claude returned invalid JSON for hashtag research");
  }

  const setsRaw = Array.isArray(parsed.sets) ? parsed.sets : [];

  return {
    sets: setsRaw.map((s: HashtagSet) => ({
      category: s.category || "General",
      tags: (Array.isArray(s.tags) ? s.tags : []).map((t) => ({
        tag: t.tag?.startsWith("#") ? t.tag : `#${t.tag}`,
        reach: t.reach || "medium",
        competition: t.competition || "medium",
      })),
    })),
    recommended: Array.isArray(parsed.recommended) ? parsed.recommended : [],
    banned: Array.isArray(parsed.banned) ? parsed.banned : [],
    tip: (parsed.tip as string) || "",
  };
}
