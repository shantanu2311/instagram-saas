import { callClaude } from "./index";
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

function buildSystemPrompt(
  hasGraphData: boolean,
  graphProfiles: CompetitorAnalysis[],
  failedHandles: string[]
): string {
  let dataContext: string;

  if (hasGraphData && graphProfiles.length > 0) {
    dataContext = `You have been given REAL data from the Instagram Graph API for some competitors. This data includes actual follower counts, engagement rates calculated from real post metrics, posting frequency, and content mix — all from the official API.

USE THIS REAL DATA AS-IS. Do NOT change the follower counts, engagement rates, or posting frequencies — they are computed from actual Instagram data.

Your job is to:
1. Add strengths and weaknesses analysis for each competitor based on their real metrics and content patterns.
2. Research trending hashtags and content formats in this niche.
3. Generate actionable insights based on the REAL competitor data.
${failedHandles.length > 0 ? `\nNote: The following handles could not be fetched via Graph API (they may be personal/private accounts): ${failedHandles.map(h => "@" + h).join(", ")}. Use web search to find what data you can about them.` : ""}`;
  } else {
    dataContext = `No Instagram Graph API data is available. Use your web search tool to research the competitors and find real data about them.

Search for each competitor's Instagram profile to find their actual follower count, content type, and engagement patterns. Use sources like SocialBlade, news articles, brand websites, and social media reports.

Be transparent about data accuracy — mark what you found via search vs what you estimated.`;
  }

  return `You are an expert Instagram growth strategist and competitive analyst.

${dataContext}

IMPORTANT:
- Only Business and Creator accounts can be analyzed via Instagram's official API. Personal/private accounts cannot be queried.
- All hashtags must be real, currently active hashtags for this niche.
- Viral examples should reference real content patterns that perform well in this niche.
- Insights must be specific, actionable, and reference actual data.
- Confidence: 90+ for data-backed, 75-89 for pattern-based, 60-74 for estimates.

Return ONLY valid JSON with this exact structure:
{
  "competitors": [
    {
      "handle": "actual_handle",
      "name": "Real Display Name",
      "followers": 45200,
      "engagementRate": 3.2,
      "postingFrequency": "5x/week",
      "topContentTypes": { "reels": 45, "carousels": 30, "images": 25 },
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"],
      "dataSource": "graph_api" or "web_search" or "estimated"
    }
  ],
  "trends": {
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6"],
    "viralExamples": [
      { "type": "Reel", "topic": "Real topic description", "views": "2.3M" }
    ],
    "trendingFormats": [
      { "name": "Format name", "growth": "+45%" }
    ]
  },
  "insights": [
    { "text": "Specific data-backed insight...", "confidence": 92, "actionable": true }
  ],
  "dataDisclaimer": "Brief note about data sources used"
}`;
}

function buildUserMessage(
  input: ResearchInput,
  graphProfiles: CompetitorAnalysis[],
  failedHandles: string[]
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

  // Graph API data
  if (graphProfiles.length > 0) {
    parts.push(`\n## Real Competitor Data (from Instagram Graph API)`);
    for (const p of graphProfiles) {
      parts.push(`\n### @${p.handle} — ${p.name}`);
      parts.push(`- **Followers:** ${p.followers.toLocaleString()} (REAL)`);
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
        `- **Data Source:** Instagram Graph API (official, verified data)`
      );
      parts.push(
        `\nAnalyze this account and add strengths/weaknesses based on their metrics and content patterns.`
      );
    }
  }

  // Handles that need web search
  if (failedHandles.length > 0) {
    parts.push(`\n## Competitors Needing Web Research`);
    parts.push(
      `These accounts could not be fetched via Graph API (may be personal/private). Search the web for their data:`
    );
    for (const h of failedHandles) {
      parts.push(`- @${h} — search for follower count, content type, niche`);
    }
  }

  // No competitors at all
  if (graphProfiles.length === 0 && failedHandles.length === 0) {
    if (input.competitors.length > 0) {
      parts.push(`\n## Competitors to Research via Web Search`);
      for (const c of input.competitors) {
        parts.push(
          `- @${c} — search for their real Instagram data (followers, content type, engagement)`
        );
      }
    } else {
      parts.push(`\n## No Competitors Provided`);
      parts.push(
        `Search the web for top Instagram accounts in the "${input.niche || input.productService || input.businessDescription}" niche. Find 2-3 relevant competitors.`
      );
    }
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
    `\nProvide a comprehensive research report. Use real Graph API data where available. For other competitors, search the web. Include trending hashtags, viral content examples, and actionable insights for this niche.`
  );

  return parts.join("\n");
}

export async function generateResearch(
  input: ResearchInput
): Promise<ResearchResults> {
  // Step 1: Try to fetch real data from Instagram Graph API
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
    // No Graph API — all handles need web search
    failedHandles = input.competitors;
    if (!igCredentials) {
      console.log(
        "No Instagram credentials. Using Claude web search for research."
      );
    }
  }

  const hasGraphData = graphProfiles.length > 0;

  // Step 2: Call Claude (with web search if needed) to complete the analysis
  const needsWebSearch = !hasGraphData || failedHandles.length > 0;

  const raw = await callClaude({
    system: buildSystemPrompt(hasGraphData, graphProfiles, failedHandles),
    userMessage: buildUserMessage(input, graphProfiles, failedHandles),
    model: "fast",
    maxTokens: 16000,
    webSearch: needsWebSearch,
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

  // Step 4: Merge Graph API data with Claude's analysis
  const competitors = Array.isArray(parsed.competitors)
    ? parsed.competitors.map((c: Record<string, unknown>) => {
        const handle = String(c.handle || "unknown").replace(/^@/, "");

        // If we have real Graph API data for this handle, use those metrics
        const graphData = graphProfiles.find(
          (g) => g.handle === handle
        );

        return {
          handle,
          name: graphData
            ? graphData.name
            : String(c.name || c.handle || "Unknown"),
          followers: graphData
            ? graphData.followers
            : Number(c.followers) || 0,
          engagementRate: graphData
            ? graphData.engagementRate
            : Number(c.engagementRate) || 0,
          postingFrequency: graphData
            ? graphData.postingFrequency
            : String(c.postingFrequency || "N/A"),
          topContentTypes: graphData
            ? graphData.topContentTypes
            : c.topContentTypes && typeof c.topContentTypes === "object"
              ? (c.topContentTypes as Record<string, number>)
              : { reels: 40, carousels: 35, images: 25 },
          // Strengths/weaknesses always from Claude's analysis
          strengths: Array.isArray(c.strengths)
            ? c.strengths.map(String)
            : [],
          weaknesses: Array.isArray(c.weaknesses)
            ? c.weaknesses.map(String)
            : [],
        };
      })
    : [];

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
