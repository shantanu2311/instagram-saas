/**
 * Hashtag seeder — runs once during strategy approval.
 *
 * Uses the user's Graph API quota (max 15 of 30/week) to:
 * 1. Validate AI-suggested strategy hashtags via ig_hashtag_search
 * 2. Fetch top_media for validated hashtags
 * 3. Mine co-occurring hashtags from top posts' captions
 * 4. Store everything in the shared HashtagCache
 * 5. Create/update the user's UserHashtagProfile
 */

import { prisma } from "@/lib/db";
import type { GraphApiCredentials } from "./instagram-graph-api";
import {
  searchHashtag,
  fetchHashtagTopMedia,
  extractHashtags,
} from "./hashtag-generator";

const SEED_QUOTA_BUDGET = 15; // Max ig_hashtag_search calls per seeding

interface StrategyHashtags {
  branded?: string[];
  niche?: string[];
  trending?: string[];
}

interface SeedResult {
  quotaUsed: number;
  hashtagsCached: number;
  profileCreated: boolean;
}

/**
 * Seed the hashtag cache from a newly approved strategy.
 * Called fire-and-forget from the strategy approve route.
 */
export async function seedHashtagsFromStrategy(
  brandId: string,
  strategy: { hashtagStrategy?: StrategyHashtags },
  niche: string,
  creds: GraphApiCredentials
): Promise<SeedResult> {
  const hashtagStrategy = strategy.hashtagStrategy;
  if (!hashtagStrategy) {
    return { quotaUsed: 0, hashtagsCached: 0, profileCreated: false };
  }

  const branded = Array.isArray(hashtagStrategy.branded) ? hashtagStrategy.branded.map(String) : [];
  const nicheHashtags = Array.isArray(hashtagStrategy.niche) ? hashtagStrategy.niche.map(String) : [];
  const trending = Array.isArray(hashtagStrategy.trending) ? hashtagStrategy.trending.map(String) : [];

  // Combine niche + trending as seeds for Graph API validation
  const seeds = [...nicheHashtags, ...trending];
  let quotaUsed = 0;

  // Maps for discovered data
  const discoveredTags = new Map<
    string,
    { displayTag: string; source: string; avgEngagement: number; coOccurrenceCount: number }
  >();

  // Add branded tags directly (no validation needed — user defined)
  for (const tag of branded) {
    const clean = tag.replace(/^#/, "").toLowerCase();
    discoveredTags.set(clean, {
      displayTag: tag.startsWith("#") ? tag : `#${tag}`,
      source: "ai_suggested",
      avgEngagement: 0,
      coOccurrenceCount: 1,
    });
  }

  // Validate seeds via Graph API and mine co-occurring hashtags
  for (const seed of seeds) {
    if (quotaUsed >= SEED_QUOTA_BUDGET) break;

    const hashtagId = await searchHashtag(seed, creds);
    quotaUsed++;

    if (!hashtagId) continue;

    // Add the validated seed itself
    const cleanSeed = seed.replace(/^#/, "").toLowerCase();
    discoveredTags.set(cleanSeed, {
      displayTag: seed.startsWith("#") ? seed : `#${seed}`,
      source: "graph_api",
      avgEngagement: 0,
      coOccurrenceCount: 1,
    });

    // Fetch top posts and mine co-occurring hashtags
    const posts = await fetchHashtagTopMedia(hashtagId, creds);
    for (const post of posts) {
      const postEngagement = post.likeCount + post.commentsCount;
      const tags = extractHashtags(post.caption);

      for (const tag of tags) {
        const clean = tag.replace(/^#/, "").toLowerCase();
        const existing = discoveredTags.get(clean);
        if (existing) {
          existing.coOccurrenceCount++;
          // Rolling average engagement
          existing.avgEngagement =
            (existing.avgEngagement * (existing.coOccurrenceCount - 1) + postEngagement) /
            existing.coOccurrenceCount;
        } else {
          discoveredTags.set(clean, {
            displayTag: tag,
            source: "co_occurrence",
            avgEngagement: postEngagement,
            coOccurrenceCount: 1,
          });
        }
      }
    }
  }

  // Cross-validate top co-occurring hashtags (use remaining quota)
  const coOccurring = Array.from(discoveredTags.entries())
    .filter(([, data]) => data.source === "co_occurrence")
    .sort((a, b) => b[1].coOccurrenceCount - a[1].coOccurrenceCount);

  for (const [tag, data] of coOccurring) {
    if (quotaUsed >= SEED_QUOTA_BUDGET) break;

    const hashtagId = await searchHashtag(tag, creds);
    quotaUsed++;

    if (hashtagId) {
      data.source = "graph_api"; // Upgrade from co_occurrence to validated
      // Optionally fetch its own top media for better engagement data
      const topMedia = await fetchHashtagTopMedia(hashtagId, creds);
      if (topMedia.length > 0) {
        const totalEng = topMedia.reduce((s, p) => s + p.likeCount + p.commentsCount, 0);
        data.avgEngagement = Math.round(totalEng / topMedia.length);
      }
    }
  }

  // Store in HashtagCache
  let hashtagsCached = 0;
  for (const [tag, data] of discoveredTags) {
    try {
      await prisma.hashtagCache.upsert({
        where: { tag },
        create: {
          tag,
          displayTag: data.displayTag,
          niche,
          source: data.source,
          avgEngagement: data.avgEngagement,
          coOccurrenceCount: data.coOccurrenceCount,
          lastValidatedAt: data.source === "graph_api" ? new Date() : null,
          lastSeenAt: new Date(),
        },
        update: {
          // Update engagement and freshness, increment co-occurrence
          avgEngagement: data.avgEngagement,
          coOccurrenceCount: { increment: data.coOccurrenceCount },
          lastSeenAt: new Date(),
          ...(data.source === "graph_api" ? { lastValidatedAt: new Date() } : {}),
          // Expand niche coverage — keep existing niche if different
          ...(niche ? { niche } : {}),
        },
      });
      hashtagsCached++;
    } catch (err) {
      // Skip duplicates or constraint errors
      console.warn(`Failed to cache hashtag ${tag}:`, err);
    }
  }

  // Create/update UserHashtagProfile
  const validatedNiche = nicheHashtags.filter((t) =>
    discoveredTags.get(t.replace(/^#/, "").toLowerCase())?.source === "graph_api"
  );

  await prisma.userHashtagProfile.upsert({
    where: { brandId },
    create: {
      brandId,
      branded,
      niche: validatedNiche.length > 0 ? validatedNiche : nicheHashtags,
      trending,
      seedQuotaUsed: quotaUsed,
      seededAt: new Date(),
    },
    update: {
      branded,
      niche: validatedNiche.length > 0 ? validatedNiche : nicheHashtags,
      trending,
      seedQuotaUsed: quotaUsed,
      seededAt: new Date(),
    },
  });

  console.log(
    `Hashtag seeding complete for brand ${brandId}: ${hashtagsCached} cached, ${quotaUsed} API calls used`
  );

  return { quotaUsed, hashtagsCached, profileCreated: true };
}

// ─── Cache query (used by hashtag-generator during post generation) ──

export interface ScoredHashtag {
  tag: string;
  displayTag: string;
  score: number;
  source: string;
  avgEngagement: number;
}

/**
 * Query cached hashtags for a niche, scored by relevance × freshness × engagement.
 */
export async function queryCachedHashtags(
  niche: string,
  limit: number = 30
): Promise<ScoredHashtag[]> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const cached = await prisma.hashtagCache.findMany({
    where: {
      niche,
      lastSeenAt: { gte: ninetyDaysAgo },
    },
    orderBy: { lastSeenAt: "desc" },
    take: limit * 2, // Fetch extra to allow scoring + filtering
  });

  if (cached.length === 0) return [];

  // Find max engagement for normalization
  const maxEngagement = Math.max(...cached.map((h) => h.avgEngagement), 1);
  const now = Date.now();

  // Score each hashtag
  const scored: ScoredHashtag[] = cached.map((h) => {
    // Relevance: graph_api validated > co_occurrence > web_crawl > ai_suggested
    const relevance =
      h.source === "graph_api" ? 1.0
        : h.source === "co_occurrence" ? 0.7
          : h.source === "web_crawl" ? 0.5
            : 0.3;

    // Freshness: linear decay over 90 days
    const daysSinceLastSeen = (now - h.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24);
    const freshness = Math.max(0, 1.0 - daysSinceLastSeen / 90);

    // Engagement: normalized 0-1
    const engagement = maxEngagement > 0 ? h.avgEngagement / maxEngagement : 0;

    const score = relevance * 0.6 + freshness * 0.25 + engagement * 0.15;

    return {
      tag: h.tag,
      displayTag: h.displayTag,
      score,
      source: h.source,
      avgEngagement: h.avgEngagement,
    };
  });

  // Sort by score descending and take top `limit`
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Store newly discovered hashtags back into the cache (feedback loop).
 * Called fire-and-forget after each post generation.
 */
export async function upsertHashtagCache(
  tags: Array<{ tag: string; displayTag: string; niche: string; source: string; avgEngagement?: number }>
): Promise<void> {
  for (const t of tags) {
    const clean = t.tag.replace(/^#/, "").toLowerCase();
    try {
      await prisma.hashtagCache.upsert({
        where: { tag: clean },
        create: {
          tag: clean,
          displayTag: t.displayTag,
          niche: t.niche,
          source: t.source,
          avgEngagement: t.avgEngagement ?? 0,
          coOccurrenceCount: 1,
          lastSeenAt: new Date(),
        },
        update: {
          lastSeenAt: new Date(),
          coOccurrenceCount: { increment: 1 },
        },
      });
    } catch {
      // Skip constraint errors
    }
  }
}
