import { cookies } from "next/headers";

/**
 * Instagram credentials resolved from cookie (OAuth) or env vars (dev/testing).
 */
export interface InstagramCredentials {
  igAccountId: string;
  accessToken: string;
  username: string;
  name: string;
  profilePicUrl: string;
  followersCount: number;
  connectedAt: string;
  expiresAt: string;
  source: "oauth" | "env";
}

/**
 * Get Instagram credentials from the best available source:
 * 1. Cookie (set by OAuth callback) — primary, contains real Page Token
 * 2. Environment variables — fallback for dev/testing
 *
 * Returns null if no credentials available.
 */
export async function getInstagramCredentials(): Promise<InstagramCredentials | null> {
  // Source 1: Cookie from OAuth flow
  try {
    const cookieStore = await cookies();
    const encoded = cookieStore.get("ig_credentials")?.value;
    if (encoded) {
      const decoded = JSON.parse(
        Buffer.from(encoded, "base64").toString("utf-8")
      );
      if (decoded.igAccountId && decoded.accessToken) {
        return {
          igAccountId: decoded.igAccountId,
          accessToken: decoded.accessToken,
          username: decoded.username || "",
          name: decoded.name || "",
          profilePicUrl: decoded.profilePicUrl || "",
          followersCount: decoded.followersCount || 0,
          connectedAt: decoded.connectedAt || "",
          expiresAt: decoded.expiresAt || "",
          source: "oauth",
        };
      }
    }
  } catch {
    // Cookie parsing failed — fall through to env vars
  }

  // Source 2: Environment variables (dev/testing)
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const envAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (envToken && envAccountId) {
    return {
      igAccountId: envAccountId,
      accessToken: envToken,
      username: "",
      name: "",
      profilePicUrl: "",
      followersCount: 0,
      connectedAt: "",
      expiresAt: "",
      source: "env",
    };
  }

  return null;
}

/**
 * Quick check if any Instagram credentials exist.
 */
export async function hasInstagramCredentials(): Promise<boolean> {
  const creds = await getInstagramCredentials();
  return creds !== null;
}
