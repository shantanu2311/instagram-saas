import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Initiates Facebook Login OAuth flow to get a Page Token
 * that enables Instagram Business Discovery API.
 *
 * Uses Facebook Login (not Instagram Login) because:
 * - business_discovery requires a Page Access Token
 * - Instagram Login tokens don't support business_discovery
 *
 * Required permissions:
 *   - pages_read_engagement: access Facebook Pages + business_discovery
 *   - instagram_basic: read IG Business account linked to the Page
 */
export async function GET(request: Request) {
  const appId = process.env.FACEBOOK_APP_ID;
  const configId = process.env.FACEBOOK_LOGIN_CONFIG_ID; // Facebook Login for Business config ID
  // Auto-detect redirect URI from request headers (works for Vercel + localhost)
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || (() => {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const proto = request.headers.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}/api/instagram/callback`;
    return `${new URL(request.url).origin}/api/instagram/callback`;
  })();

  if (!appId) {
    return NextResponse.json(
      { error: "Facebook App not configured. Set FACEBOOK_APP_ID in .env" },
      { status: 500 }
    );
  }

  // CSRF protection
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  // Facebook Login OAuth URL — gets Page Token for business_discovery
  const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  if (configId) {
    // Facebook Login for Business — uses config_id ONLY, no scope parameter
    authUrl.searchParams.set("config_id", configId);
    console.log("Using Facebook Login for Business config_id:", configId);
  } else {
    // Standard Facebook Login — uses scope parameter
    authUrl.searchParams.set("scope", "pages_read_engagement,instagram_basic,pages_show_list");
    console.log("Using standard Facebook Login with scope");
  }

  console.log("OAuth redirect URL:", authUrl.toString());

  return NextResponse.redirect(authUrl.toString());
}
