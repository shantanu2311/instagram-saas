/**
 * Hashtag discovery utility — cache-first, zero Graph API cost per post.
 *
 * Per-post flow:
 * 1. Query HashtagCache for brand's niche (scored by relevance × freshness × engagement)
 * 2. Get user's strategy hashtags from UserHashtagProfile
 * 3. Python web crawler finds fresh topic-specific hashtags
 * 4. AI combines all three sources → picks best 12-15
 * 5. Store new hashtags back to cache (feedback loop)
 *
 * Graph API is ONLY used during strategy seeding (see hashtag-seeder.ts).
 */

import { callAI, type BrandContext } from "./index";
import { prisma } from "@/lib/db";
import type { GraphApiCredentials } from "./instagram-graph-api";
import { queryCachedHashtags, upsertHashtagCache } from "./hashtag-seeder";

// ─── Graph API helpers (exported for use by hashtag-seeder) ──────────

export async function searchHashtag(
  hashtag: string,
  creds: GraphApiCredentials
): Promise<string | null> {
  const clean = hashtag.replace(/^#/, "").toLowerCase();
  const url = `https://graph.facebook.com/v21.0/ig_hashtag_search?q=${encodeURIComponent(clean)}&user_id=${creds.igAccountId}&access_token=${creds.accessToken}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: Array<{ id: string }> };
    return data.data?.[0]?.id || null;
  } catch {
    return null;
  }
}

export async function fetchHashtagTopMedia(
  hashtagId: string,
  creds: GraphApiCredentials
): Promise<Array<{ id: string; caption: string; likeCount: number; commentsCount: number }>> {
  const fields = "id,caption,like_count,comments_count";
  const url = `https://graph.facebook.com/v21.0/${hashtagId}/top_media?user_id=${creds.igAccountId}&fields=${fields}&limit=25&access_token=${creds.accessToken}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: Array<Record<string, unknown>> };
    return (data.data || []).map((p) => ({
      id: String(p.id || ""),
      caption: String(p.caption || ""),
      likeCount: Number(p.like_count) || 0,
      commentsCount: Number(p.comments_count) || 0,
    }));
  } catch {
    return [];
  }
}

export function extractHashtags(caption: string): string[] {
  const matches = caption.match(/#[a-zA-Z0-9_]+/g);
  return matches ? [...new Set(matches.map((h) => h.toLowerCase()))] : [];
}

// ─── Web crawl for fresh topic-specific hashtags ─────────────────────

async function discoverTagsViaCrawl(
  topic: string,
  niche: string
): Promise<string[]> {
  try {
    const res = await fetch("http://localhost:8000/api/hashtags/discover-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, niche }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { hashtags?: string[] };
    return data.hashtags || [];
  } catch {
    return [];
  }
}

// ─── Main discovery function (cache-first) ───────────────────────────

export interface DiscoveredHashtags {
  hashtags: string[];
  dataSource: "cache" | "web_crawl" | "ai_only";
  cacheHits: number;
}

/**
 * Discover hashtags for a specific post topic.
 * Called by caption-generator during content generation.
 *
 * Zero Graph API cost — uses cache + web crawl + strategy context.
 */
export async function discoverHashtags(
  topic: string,
  brand: BrandContext,
  brandId?: string
): Promise<DiscoveredHashtags> {
  const niche = brand.niche || "general";

  // Run all three sources in parallel
  const [cachedHashtags, userProfile, crawledTags] = await Promise.all([
    // Source 1: Shared hashtag cache (scored)
    queryCachedHashtags(niche, 30).catch(() => []),

    // Source 2: User's strategy hashtag profile
    brandId
      ? prisma.userHashtagProfile
          .findUnique({ where: { brandId } })
          .catch(() => null)
      : Promise.resolve(null),

    // Source 3: Fresh web-crawled hashtags for this specific topic
    discoverTagsViaCrawl(topic, niche).catch(() => []),
  ]);

  const cacheHits = cachedHashtags.length;

  // Build context for AI selection
  const strategyBranded = userProfile
    ? (userProfile.branded as string[]).map((t) => String(t))
    : [];
  const strategyNiche = userProfile
    ? (userProfile.niche as string[]).map((t) => String(t))
    : [];

  // If we have no data at all, fall back to AI-only
  if (cacheHits === 0 && crawledTags.length === 0 && strategyBranded.length === 0) {
    return { hashtags: [], dataSource: "ai_only", cacheHits: 0 };
  }

  // Build hashtag lists for AI
  const cachedList = cachedHashtags
    .slice(0, 20)
    .map((h) => `${h.displayTag} (score: ${h.score.toFixed(2)}, source: ${h.source})`)
    .join("\n");

  const crawledList = crawledTags.slice(0, 15).join(", ");

  const strategyList = [...strategyBranded, ...strategyNiche].join(", ");

  // AI selects the best 12-15 from all sources
  const aiResponse = await callAI({
    system: `You are an Instagram hashtag strategist. You have three sources of REAL hashtag data. Select the best 12-15 hashtags for this specific post.

RULES:
1. ALWAYS include the brand's branded hashtags (from strategy)
2. Pick 5-7 from the cached/validated hashtags (prefer higher scores)
3. Pick 2-3 fresh/trending from the web crawl
4. Add 1-2 broader reach hashtags if needed
5. Total: 12-15 hashtags max

Brand: ${brand.brandName || "growing brand"}
Niche: ${niche}
${brand.brandHashtag ? `Brand hashtag (always include): ${brand.brandHashtag}` : ""}

Return ONLY a JSON array of hashtag strings. Example: ["#tag1", "#tag2", ...]`,
    userMessage: `Post topic: ${topic}

STRATEGY HASHTAGS (branded + niche baseline — include branded ones):
${strategyList || "None available"}

CACHED HASHTAGS (validated, scored by relevance × freshness × engagement):
${cachedList || "Cache empty — this is a new niche"}

FRESH WEB-CRAWLED HASHTAGS (topic-specific, trending):
${crawledList || "No crawl results"}`,
    model: "fast",
    maxTokens: 400,
  });

  let hashtags: string[] = [];
  try {
    const match = aiResponse.match(/\[[\s\S]*\]/);
    if (match) {
      hashtags = JSON.parse(match[0]).map(String).slice(0, 15);
    }
  } catch {
    // Parse failed — use top cached + strategy as fallback
    hashtags = [
      ...strategyBranded.slice(0, 3),
      ...cachedHashtags.slice(0, 9).map((h) => h.displayTag),
    ];
  }

  // Feedback loop: store web-crawled hashtags back to cache (fire-and-forget)
  if (crawledTags.length > 0) {
    const newTags = crawledTags.map((t) => ({
      tag: t.replace(/^#/, "").toLowerCase(),
      displayTag: t.startsWith("#") ? t : `#${t}`,
      niche,
      source: "web_crawl",
    }));
    upsertHashtagCache(newTags).catch((err) =>
      console.warn("Hashtag cache feedback failed:", err)
    );
  }

  return {
    hashtags,
    dataSource: cacheHits > 0 ? "cache" : "web_crawl",
    cacheHits,
  };
}
