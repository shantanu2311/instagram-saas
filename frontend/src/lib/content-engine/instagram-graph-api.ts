/**
 * Instagram Graph API — Business Discovery
 *
 * Uses the official Instagram Graph API to fetch real competitor data.
 * Requires: INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in env.
 *
 * The Business Discovery endpoint works ONLY for public Business and Creator accounts.
 * Personal/private accounts cannot be queried.
 *
 * Endpoint: GET /{user-id}?fields=business_discovery.username(handle){...}
 *
 * What we CAN get:
 *   - Follower count, media count, biography, website, verified status
 *   - Recent posts: like_count, comments_count, caption, timestamp, media_type
 *   → Enough to compute: engagement rate, posting frequency, content mix, top posts
 *
 * What we CANNOT get:
 *   - Follower lists, Story metrics, Reel view counts, save/share counts
 *   - Data from personal/private accounts
 */

export interface IGBusinessProfile {
  handle: string;
  name: string;
  bio: string;
  followers: number;
  mediaCount: number;
  website: string;
  isVerified: boolean;
  profilePicUrl: string;
  recentMedia: IGMediaItem[];
  dataSource: "graph_api";
}

export interface IGMediaItem {
  id: string;
  caption: string;
  timestamp: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  likeCount: number;
  commentsCount: number;
}

export interface CompetitorAnalysis {
  handle: string;
  name: string;
  followers: number;
  engagementRate: number;
  postingFrequency: string;
  topContentTypes: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recentPostCount: number;
  avgLikes: number;
  avgComments: number;
  dataSource: "graph_api" | "ai_estimated";
}

export interface GraphApiCredentials {
  accessToken: string;
  igAccountId: string;
}

/**
 * Fetch a competitor's profile via the Business Discovery API.
 * Only works for public Business/Creator accounts.
 *
 * @param handle - Instagram handle to look up
 * @param credentials - Access token + account ID (from OAuth or env)
 */
export async function fetchCompetitorProfile(
  handle: string,
  credentials: GraphApiCredentials
): Promise<IGBusinessProfile | null> {
  const { accessToken, igAccountId: accountId } = credentials;
  if (!accessToken || !accountId) return null;

  const cleanHandle = handle.replace(/^@/, "").trim().toLowerCase();

  const fields = [
    "username",
    "name",
    "biography",
    "followers_count",
    "media_count",
    "website",
    "profile_picture_url",
    "ig_id",
    "media.limit(25){id,caption,timestamp,media_type,like_count,comments_count}",
  ].join(",");

  // Try Facebook Graph API first (works with Facebook Login tokens / Page tokens),
  // then fall back to Instagram Graph API (works with Instagram Login tokens).
  // business_discovery requires a token with pages_read_engagement or instagram_business_basic scope.
  const urls = [
    `https://graph.facebook.com/v21.0/${accountId}?fields=business_discovery.username(${cleanHandle}){${fields}}&access_token=${accessToken}`,
    `https://graph.instagram.com/v21.0/${accountId}?fields=business_discovery.username(${cleanHandle}){${fields}}&access_token=${accessToken}`,
  ];

  try {
    // Try Facebook Graph API first, then fall back to Instagram Graph API
    let lastError = "";
    for (const url of urls) {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        lastError =
          (errorData as Record<string, Record<string, string>>)?.error?.message || `HTTP ${res.status}`;
        console.warn(
          `Graph API attempt failed for @${cleanHandle} (${url.includes("graph.facebook") ? "Facebook" : "Instagram"} endpoint):`,
          lastError
        );
        continue; // Try next URL
      }

      const data = await res.json();
      const bd = (data as Record<string, Record<string, unknown>>)?.business_discovery;
      if (!bd) {
        console.warn(`No business_discovery field in response for @${cleanHandle}`);
        continue;
      }

      const mediaEdges = (bd.media as Record<string, unknown>)?.data;
      const recentMedia: IGMediaItem[] = Array.isArray(mediaEdges)
        ? mediaEdges.map((m: Record<string, unknown>) => ({
            id: String(m.id || ""),
            caption: String(m.caption || ""),
            timestamp: String(m.timestamp || ""),
            mediaType: (m.media_type as IGMediaItem["mediaType"]) || "IMAGE",
            likeCount: Number(m.like_count) || 0,
            commentsCount: Number(m.comments_count) || 0,
          }))
        : [];

      return {
        handle: cleanHandle,
        name: String(bd.name || cleanHandle),
        bio: String(bd.biography || ""),
        followers: Number(bd.followers_count) || 0,
        mediaCount: Number(bd.media_count) || 0,
        website: String(bd.website || ""),
        isVerified: false, // Not available via Business Discovery
        profilePicUrl: String(bd.profile_picture_url || ""),
        recentMedia,
        dataSource: "graph_api",
      };
    }

    // All URLs failed
    console.error(`Instagram Graph API: all endpoints failed for @${cleanHandle}:`, lastError);
    return null;
  } catch (err) {
    console.error(
      `Failed to fetch @${cleanHandle} from Graph API:`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Analyze a fetched profile to compute engagement rate, posting frequency, content mix.
 */
export function analyzeProfile(profile: IGBusinessProfile): CompetitorAnalysis {
  const media = profile.recentMedia;

  // Engagement rate: avg (likes + comments) / followers * 100
  let avgLikes = 0;
  let avgComments = 0;
  let engagementRate = 0;

  if (media.length > 0) {
    const totalLikes = media.reduce((sum, m) => sum + m.likeCount, 0);
    const totalComments = media.reduce((sum, m) => sum + m.commentsCount, 0);
    avgLikes = Math.round(totalLikes / media.length);
    avgComments = Math.round(totalComments / media.length);

    if (profile.followers > 0) {
      engagementRate =
        Math.round(
          ((avgLikes + avgComments) / profile.followers) * 100 * 100
        ) / 100; // 2 decimal places
    }
  }

  // Posting frequency: compute from timestamps
  let postingFrequency = "N/A";
  if (media.length >= 2) {
    const timestamps = media
      .map((m) => new Date(m.timestamp).getTime())
      .filter((t) => !isNaN(t))
      .sort((a, b) => b - a); // newest first

    if (timestamps.length >= 2) {
      const spanDays =
        (timestamps[0] - timestamps[timestamps.length - 1]) /
        (1000 * 60 * 60 * 24);
      if (spanDays > 0) {
        const postsPerWeek = Math.round((timestamps.length / spanDays) * 7);
        postingFrequency = `${Math.max(1, postsPerWeek)}x/week`;
      }
    }
  }

  // Content mix: count by media type
  const typeCounts: Record<string, number> = {
    reels: 0,
    carousels: 0,
    images: 0,
  };
  for (const m of media) {
    if (m.mediaType === "VIDEO") typeCounts.reels++;
    else if (m.mediaType === "CAROUSEL_ALBUM") typeCounts.carousels++;
    else typeCounts.images++;
  }

  const total = media.length || 1;
  const topContentTypes = {
    reels: Math.round((typeCounts.reels / total) * 100),
    carousels: Math.round((typeCounts.carousels / total) * 100),
    images: Math.round((typeCounts.images / total) * 100),
  };

  return {
    handle: profile.handle,
    name: profile.name,
    followers: profile.followers,
    engagementRate,
    postingFrequency,
    topContentTypes,
    strengths: [], // Will be filled by AI analysis
    weaknesses: [], // Will be filled by AI analysis
    recentPostCount: media.length,
    avgLikes,
    avgComments,
    dataSource: "graph_api",
  };
}

/**
 * Fetch the authenticated user's own recent media.
 * Uses the User Media edge: GET /{ig-user-id}/media?fields=...
 *
 * @param credentials - Access token + IG user ID (from OAuth or env)
 * @param limit - Max posts to fetch (default 25)
 */
export async function fetchOwnMedia(
  credentials: { accessToken: string; igUserId: string },
  limit: number = 25
): Promise<
  Array<{
    id: string;
    caption?: string;
    timestamp: string;
    media_type: string;
    like_count?: number;
    comments_count?: number;
    permalink?: string;
    media_url?: string;
  }>
> {
  const fields =
    "id,caption,timestamp,media_type,like_count,comments_count,permalink,media_url";
  const url = `https://graph.instagram.com/${credentials.igUserId}/media?fields=${fields}&limit=${limit}&access_token=${credentials.accessToken}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    throw new Error(`Instagram API error: ${res.status}`);
  }

  const data = (await res.json()) as { data?: Array<{
    id: string;
    caption?: string;
    timestamp: string;
    media_type: string;
    like_count?: number;
    comments_count?: number;
    permalink?: string;
    media_url?: string;
  }> };
  return data.data || [];
}

/**
 * Analyze the authenticated user's own Instagram page.
 * Fetches recent posts and computes engagement, content mix, top posts, best times.
 * Used as input to strategy generation.
 */
export async function analyzeOwnPage(
  credentials: { accessToken: string; igUserId: string },
  followerCount?: number
): Promise<{
  handle: string;
  followers: number;
  totalPosts: number;
  engagementRate: number;
  avgLikes: number;
  avgComments: number;
  postingFrequency: string;
  contentMix: { reels: number; carousels: number; images: number };
  topPosts: Array<{ caption: string; type: string; likes: number; comments: number }>;
  bestPostingTimes: string[];
} | null> {
  try {
    const media = await fetchOwnMedia(credentials, 25);
    if (!media || media.length === 0) return null;

    // Also fetch profile info for follower count + username
    let followers = followerCount || 0;
    let handle = "";
    let totalPosts = 0;
    try {
      const profileUrl = `https://graph.instagram.com/${credentials.igUserId}?fields=username,media_count,followers_count&access_token=${credentials.accessToken}`;
      const profileRes = await fetch(profileUrl, { signal: AbortSignal.timeout(10_000) });
      if (profileRes.ok) {
        const profile = await profileRes.json() as Record<string, unknown>;
        followers = Number(profile.followers_count) || followers;
        handle = String(profile.username || "");
        totalPosts = Number(profile.media_count) || 0;
      }
    } catch {
      // Non-fatal — continue with what we have
    }

    // Engagement
    const totalLikes = media.reduce((sum, m) => sum + (m.like_count || 0), 0);
    const totalComments = media.reduce((sum, m) => sum + (m.comments_count || 0), 0);
    const avgLikes = Math.round(totalLikes / media.length);
    const avgComments = Math.round(totalComments / media.length);
    const engagementRate = followers > 0
      ? Math.round(((avgLikes + avgComments) / followers) * 100 * 100) / 100
      : 0;

    // Posting frequency
    let postingFrequency = "N/A";
    const timestamps = media
      .map(m => new Date(m.timestamp).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => b - a);
    if (timestamps.length >= 2) {
      const spanDays = (timestamps[0] - timestamps[timestamps.length - 1]) / (1000 * 60 * 60 * 24);
      if (spanDays > 0) {
        const postsPerWeek = Math.round((timestamps.length / spanDays) * 7);
        postingFrequency = `${Math.max(1, postsPerWeek)}x/week`;
      }
    }

    // Content mix
    const typeCounts = { reels: 0, carousels: 0, images: 0 };
    for (const m of media) {
      if (m.media_type === "VIDEO") typeCounts.reels++;
      else if (m.media_type === "CAROUSEL_ALBUM") typeCounts.carousels++;
      else typeCounts.images++;
    }
    const total = media.length || 1;
    const contentMix = {
      reels: Math.round((typeCounts.reels / total) * 100),
      carousels: Math.round((typeCounts.carousels / total) * 100),
      images: Math.round((typeCounts.images / total) * 100),
    };

    // Top posts by engagement (likes + comments)
    const sorted = [...media].sort(
      (a, b) => ((b.like_count || 0) + (b.comments_count || 0)) - ((a.like_count || 0) + (a.comments_count || 0))
    );
    const topPosts = sorted.slice(0, 5).map(m => ({
      caption: (m.caption || "").slice(0, 200),
      type: m.media_type === "VIDEO" ? "reel" : m.media_type === "CAROUSEL_ALBUM" ? "carousel" : "image",
      likes: m.like_count || 0,
      comments: m.comments_count || 0,
    }));

    // Best posting times (extract hour from timestamps)
    const hourCounts: Record<number, { count: number; engagement: number }> = {};
    for (const m of media) {
      const d = new Date(m.timestamp);
      if (isNaN(d.getTime())) continue;
      const hour = d.getHours();
      if (!hourCounts[hour]) hourCounts[hour] = { count: 0, engagement: 0 };
      hourCounts[hour].count++;
      hourCounts[hour].engagement += (m.like_count || 0) + (m.comments_count || 0);
    }
    const bestHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => (b.engagement / b.count) - (a.engagement / a.count))
      .slice(0, 3)
      .map(([hour]) => {
        const h = Number(hour);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${h12}:00 ${ampm}`;
      });

    return {
      handle,
      followers,
      totalPosts,
      engagementRate,
      avgLikes,
      avgComments,
      postingFrequency,
      contentMix,
      topPosts,
      bestPostingTimes: bestHours,
    };
  } catch (err) {
    console.error("Failed to analyze own IG page:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Fetch and analyze multiple competitor profiles.
 * Returns analyzed profiles for those that succeeded, null for failures.
 */
export async function fetchAndAnalyzeCompetitors(
  handles: string[],
  credentials: GraphApiCredentials
): Promise<{ analyzed: CompetitorAnalysis[]; failed: string[] }> {
  const analyzed: CompetitorAnalysis[] = [];
  const failed: string[] = [];

  // Fetch 2 at a time to avoid rate limits
  for (let i = 0; i < handles.length; i += 2) {
    const chunk = handles.slice(i, i + 2);
    const results = await Promise.all(
      chunk.map((h) => fetchCompetitorProfile(h, credentials))
    );

    for (let j = 0; j < chunk.length; j++) {
      const profile = results[j];
      if (profile) {
        analyzed.push(analyzeProfile(profile));
      } else {
        failed.push(chunk[j]);
      }
    }
  }

  return { analyzed, failed };
}
