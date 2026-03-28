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

  const url = `https://graph.instagram.com/v21.0/${accountId}?fields=business_discovery.username(${cleanHandle}){${fields}}&access_token=${accessToken}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg =
        (errorData as Record<string, Record<string, string>>)?.error?.message || `HTTP ${res.status}`;
      console.error(
        `Instagram Graph API error for @${cleanHandle}:`,
        errorMsg
      );
      return null;
    }

    const data = await res.json();
    const bd = (data as Record<string, Record<string, unknown>>)?.business_discovery;
    if (!bd) return null;

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
    strengths: [], // Will be filled by Claude analysis
    weaknesses: [], // Will be filled by Claude analysis
    recentPostCount: media.length,
    avgLikes,
    avgComments,
    dataSource: "graph_api",
  };
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
