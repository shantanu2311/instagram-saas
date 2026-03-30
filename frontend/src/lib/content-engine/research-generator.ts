import { callAI } from "./index";
import {
  fetchAndAnalyzeCompetitors,
  type CompetitorAnalysis,
} from "./instagram-graph-api";
import { getInstagramCredentials } from "@/lib/instagram-token";
import type { ResearchResults } from "@/lib/stores/strategy-store";

export interface ResearchInput {
  accountType: string;
  businessName: string;
  businessDescription: string;
  productService: string;
  niche?: string;
  competitors: string[];
  goals: string[];
  targetDemographics: string[];
  targetLocation: string;
  targetAgeMin: number;
  targetAgeMax: number;
  targetGender: string;
  contentPreferences: string[];
  brandPersonality: string[];
  usp: string;
}

function buildSystemPrompt(graphProfiles: CompetitorAnalysis[]): string {
  return `You are an expert Instagram growth strategist and competitive analyst.

You have been given REAL data from the Instagram Graph API for competitors. This data includes actual follower counts, engagement rates calculated from real post metrics, posting frequency, and content mix — all from the official API.

USE THIS REAL DATA AS-IS. Do NOT change the follower counts, engagement rates, or posting frequencies — they are computed from actual Instagram data.

Your job is to:
1. Add strengths and weaknesses analysis for each competitor based on their real metrics and content patterns.
2. Identify trending hashtags based on the niche and the real competitor data provided.
3. Identify viral content patterns and trending formats based on the real data.
4. Generate actionable insights based on the REAL competitor data.

IMPORTANT:
- NEVER use placeholder text like "Strength 1" or "Weakness 1". Write REAL, specific analysis unique to each account.
- NEVER copy the example text from this prompt — every strength/weakness must be original analysis based on the actual metrics.
- Strengths/weaknesses must reference the real data (e.g. engagement rate, content mix, posting frequency).
- Hashtags should be relevant to the niche — base them on the competitor content patterns you see.
- Viral examples should describe content patterns that work well based on the real engagement data.
- Trending formats should be based on what content types perform best in the real data.
- Confidence: 90+ for data-backed, 75-89 for pattern-based, 60-74 for estimates.

Return ONLY valid JSON with this structure:
{
  "competitors": [
    {
      "handle": "username_without_at",
      "strengths": ["Specific observation about this account based on real metrics"],
      "weaknesses": ["Specific gap observed from real data"]
    }
  ],
  "trends": {
    "hashtags": ["#RelevantHashtag1", "#RelevantHashtag2"],
    "viralExamples": [
      { "type": "Reel", "topic": "Content pattern that drives high engagement based on data", "views": "estimated reach" }
    ],
    "trendingFormats": [
      { "name": "Format performing well in data", "growth": "+N%" }
    ]
  },
  "insights": [
    { "text": "Specific data-backed insight referencing real numbers...", "confidence": 92, "actionable": true }
  ]
}`;
}

function buildUserMessage(
  input: ResearchInput,
  graphProfiles: CompetitorAnalysis[]
): string {
  const parts: string[] = [];

  parts.push(`## Business Profile`);
  parts.push(`**Account Type:** ${input.accountType}`);
  parts.push(`**Business/Brand:** ${input.businessName}`);
  if (input.businessDescription)
    parts.push(`**Description:** ${input.businessDescription}`);
  if (input.productService)
    parts.push(`**Product/Service:** ${input.productService}`);
  if (input.niche) parts.push(`**Niche:** ${input.niche}`);
  if (input.usp) parts.push(`**USP:** ${input.usp}`);

  parts.push(`\n## Real Competitor Data (from Instagram Graph API)`);
  for (const p of graphProfiles) {
    parts.push(`\n### @${p.handle} — ${p.name}`);
    parts.push(`- **Followers:** ${p.followers.toLocaleString()}`);
    parts.push(
      `- **Engagement Rate:** ${p.engagementRate}% (calculated from ${p.recentPostCount} recent posts)`
    );
    parts.push(`- **Avg Likes:** ${p.avgLikes.toLocaleString()}`);
    parts.push(`- **Avg Comments:** ${p.avgComments.toLocaleString()}`);
    parts.push(`- **Posting Frequency:** ${p.postingFrequency}`);
    parts.push(
      `- **Content Mix:** Reels ${p.topContentTypes.reels}%, Carousels ${p.topContentTypes.carousels}%, Images ${p.topContentTypes.images}%`
    );
    parts.push(
      `\nAnalyze this account and add strengths/weaknesses based on their metrics and content patterns.`
    );
  }

  parts.push(`\n## Target Audience`);
  if (input.goals.length > 0)
    parts.push(`**Goals:** ${input.goals.join(", ")}`);
  if (input.targetDemographics.length > 0)
    parts.push(
      `**Demographics:** ${input.targetDemographics.join(", ")}`
    );
  parts.push(`**Age Range:** ${input.targetAgeMin}-${input.targetAgeMax}`);
  if (input.targetLocation)
    parts.push(`**Location:** ${input.targetLocation}`);
  if (input.targetGender !== "all")
    parts.push(`**Gender:** ${input.targetGender}`);
  if (input.contentPreferences.length > 0)
    parts.push(
      `**Content Preferences:** ${input.contentPreferences.join(", ")}`
    );
  if (input.brandPersonality.length > 0)
    parts.push(
      `**Brand Personality:** ${input.brandPersonality.join(", ")}`
    );

  parts.push(
    `\nAnalyze the competitor data above. Add strengths/weaknesses for each competitor, identify trends and hashtags relevant to this niche, and provide actionable insights.`
  );

  return parts.join("\n");
}

export async function generateResearch(
  input: ResearchInput
): Promise<ResearchResults> {
  // Step 1: Fetch real data from Instagram Graph API
  let graphProfiles: CompetitorAnalysis[] = [];
  let failedHandles: string[] = [];

  const igCredentials = await getInstagramCredentials();

  if (igCredentials && input.competitors.length > 0) {
    console.log(
      `Instagram Graph API credentials found (source: ${igCredentials.source}). Fetching competitor data...`
    );
    const result = await fetchAndAnalyzeCompetitors(input.competitors, {
      accessToken: igCredentials.accessToken,
      igAccountId: igCredentials.igAccountId,
    });
    graphProfiles = result.analyzed;
    failedHandles = result.failed;
    console.log(
      `Graph API: ${graphProfiles.length} profiles fetched, ${failedHandles.length} failed`
    );
  } else {
    failedHandles = input.competitors;
    console.log(
      "No Instagram Graph API credentials. Competitor research requires Graph API connection."
    );
  }

  // Build competitor entries for failed handles (no data available)
  const failedCompetitors = failedHandles.map((handle) => ({
    handle: handle.replace(/^@/, ""),
    name: handle.replace(/^@/, ""),
    followers: 0,
    engagementRate: 0,
    postingFrequency: "",
    topContentTypes: { reels: 0, carousels: 0, images: 0 },
    strengths: [] as string[],
    weaknesses: [] as string[],
  }));

  // If no Graph API data at all, return empty results with failed competitors
  if (graphProfiles.length === 0) {
    return {
      competitors: failedCompetitors,
      trends: { hashtags: [], viralExamples: [], trendingFormats: [] },
      insights: [],
    };
  }

  // Step 2: Call AI to analyze the real Graph API data (no web search needed)
  const raw = await callAI({
    system: buildSystemPrompt(graphProfiles),
    userMessage: buildUserMessage(input, graphProfiles),
    model: "fast",
    maxTokens: 8000,
  });

  // Step 3: Parse JSON response
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse research results from AI response.");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("Failed to parse research results JSON.");
  }

  // Step 4: Merge Graph API metrics with AI's analysis
  const analyzedCompetitors = graphProfiles.map((gp) => {
    // Find AI's analysis for this handle
    const aiAnalysis = Array.isArray(parsed.competitors)
      ? parsed.competitors.find(
          (c: Record<string, unknown>) =>
            String(c.handle || "").replace(/^@/, "") === gp.handle
        ) as Record<string, unknown> | undefined
      : undefined;

    return {
      handle: gp.handle,
      name: gp.name,
      followers: gp.followers,
      engagementRate: gp.engagementRate,
      postingFrequency: gp.postingFrequency,
      topContentTypes: gp.topContentTypes,
      strengths: aiAnalysis && Array.isArray(aiAnalysis.strengths)
        ? aiAnalysis.strengths
            .map(String)
            .filter((s: string) => !/^(strength|weakness)\s*\d*$/i.test(s.trim()))
        : [],
      weaknesses: aiAnalysis && Array.isArray(aiAnalysis.weaknesses)
        ? aiAnalysis.weaknesses
            .map(String)
            .filter((s: string) => !/^(strength|weakness)\s*\d*$/i.test(s.trim()))
        : [],
    };
  });

  // Combine analyzed + failed competitors
  const competitors = [...analyzedCompetitors, ...failedCompetitors];

  const trends =
    parsed.trends && typeof parsed.trends === "object"
      ? {
          hashtags: Array.isArray(
            (parsed.trends as Record<string, unknown>).hashtags
          )
            ? (
                (parsed.trends as Record<string, unknown>)
                  .hashtags as string[]
              ).map(String)
            : [],
          viralExamples: Array.isArray(
            (parsed.trends as Record<string, unknown>).viralExamples
          )
            ? (
                (parsed.trends as Record<string, unknown>)
                  .viralExamples as Array<Record<string, unknown>>
              ).map((ex) => ({
                type: String(ex.type || "Reel"),
                topic: String(ex.topic || ""),
                views: String(ex.views || "0"),
              }))
            : [],
          trendingFormats: Array.isArray(
            (parsed.trends as Record<string, unknown>).trendingFormats
          )
            ? (
                (parsed.trends as Record<string, unknown>)
                  .trendingFormats as Array<Record<string, unknown>>
              ).map((f) => ({
                name: String(f.name || ""),
                growth: String(f.growth || "+0%"),
              }))
            : [],
        }
      : { hashtags: [], viralExamples: [], trendingFormats: [] };

  const insights = Array.isArray(parsed.insights)
    ? parsed.insights.map((ins: Record<string, unknown>) => ({
        text: String(ins.text || ""),
        confidence: Math.min(
          99,
          Math.max(50, Number(ins.confidence) || 75)
        ),
        actionable: ins.actionable !== false,
      }))
    : [];

  return { competitors, trends, insights };
}
