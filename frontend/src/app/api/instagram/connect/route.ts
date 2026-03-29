import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Initiates Instagram Login OAuth flow for Instagram Business Discovery.
 *
 * Uses the Instagram API with Instagram Login (not Facebook Login).
 * This works directly with Instagram Business/Creator accounts
 * without needing to go through Facebook Pages.
 *
 * Required permission:
 *   - instagram_business_basic: read IG Business account info + Business Discovery
 */
export async function GET(request: Request) {
  const appId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID;
  // Use explicit env var, or auto-detect from request origin (works for Vercel + localhost)
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || (() => {
    // In production (Vercel), use the deployment URL from headers
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const proto = request.headers.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}/api/instagram/callback`;
    // Fallback to parsing request URL
    const origin = new URL(request.url).origin;
    return `${origin}/api/instagram/callback`;
  })();

  if (!appId) {
    return NextResponse.json(
      {
        error:
          "Facebook App not configured. Set FACEBOOK_APP_ID in .env",
      },
      { status: 500 }
    );
  }

  // CSRF protection: generate state token and store in cookie
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  // Instagram Login OAuth URL (direct Instagram auth, not Facebook)
  const authUrl = new URL("https://www.instagram.com/oauth/authorize");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "instagram_business_basic");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
