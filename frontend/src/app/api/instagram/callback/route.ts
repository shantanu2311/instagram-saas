import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Instagram Login OAuth callback.
 *
 * Flow:
 * 1. Verify CSRF state
 * 2. Exchange code → short-lived Instagram token (via instagram.com)
 * 3. Exchange short-lived → long-lived token (60 days, via graph.instagram.com)
 * 4. Get user profile info (username, name, followers, profile pic)
 * 5. Store credentials in cookie
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3002";

  // Check for errors
  if (error || !code) {
    const errorMsg = url.searchParams.get("error_description") || "denied";
    return NextResponse.redirect(
      new URL(`/settings?ig_error=${encodeURIComponent(errorMsg)}`, baseUrl)
    );
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("ig_oauth_state")?.value;
  cookieStore.delete("ig_oauth_state");

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL("/settings?ig_error=invalid_state", baseUrl)
    );
  }

  const appId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID || "";
  const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET || "";
  // Must match exactly what's registered in Instagram Login settings
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || "https://localhost:3002/api/instagram/callback";

  try {
    // Step 1: Exchange code for short-lived Instagram Access Token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      console.error("Instagram token exchange failed:", err);
      return NextResponse.redirect(
        new URL("/settings?ig_error=token_exchange_failed", baseUrl)
      );
    }

    const tokenData = await tokenRes.json();
    const shortLivedToken = tokenData.access_token;
    const userId = tokenData.user_id;
    console.log("Instagram short-lived token obtained for user:", userId);

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortLivedToken}`
    );
    const longLivedData = await longLivedRes.json();
    const longLivedToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || 5184000; // 60 days
    console.log("Long-lived token obtained, expires in:", expiresIn, "seconds");

    // Step 3: Get user profile info
    const profileRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=user_id,username,name,profile_picture_url,followers_count,media_count,biography&access_token=${longLivedToken}`
    );
    const profile = await profileRes.json();
    console.log("Instagram profile:", JSON.stringify(profile, null, 2));

    const igAccountId = String(profile.user_id || userId);
    const username = profile.username || "";

    if (!username) {
      console.error("No username in profile response:", profile);
      return NextResponse.redirect(
        new URL("/settings?ig_error=no_business_account", baseUrl)
      );
    }

    // Step 4: Store credentials in cookie
    const igCredentials = {
      igAccountId,
      accessToken: longLivedToken,
      username,
      name: profile.name || "",
      profilePicUrl: profile.profile_picture_url || "",
      followersCount: profile.followers_count || 0,
      mediaCount: profile.media_count || 0,
      bio: profile.biography || "",
      connectedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };

    console.log("Instagram Business Account connected:", {
      username: igCredentials.username,
      followers: igCredentials.followersCount,
      igAccountId,
    });

    // Store in cookie (base64-encoded JSON)
    const encoded = Buffer.from(JSON.stringify(igCredentials)).toString("base64");
    cookieStore.set("ig_credentials", encoded, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 55, // 55 days
      path: "/",
    });

    return NextResponse.redirect(
      new URL(
        `/settings?ig_connected=true&ig_username=${encodeURIComponent(username)}`,
        baseUrl
      )
    );
  } catch (err) {
    console.error("Instagram OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/settings?ig_error=unknown", baseUrl)
    );
  }
}
