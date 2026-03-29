import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Facebook Login OAuth callback.
 *
 * Flow:
 * 1. Verify CSRF state
 * 2. Exchange code → Facebook User Access Token
 * 3. Get long-lived User Token (60 days)
 * 4. Fetch Facebook Pages → find linked Instagram Business Account
 * 5. Get long-lived Page Token (never expires while user token is valid)
 * 6. Fetch Instagram Business Account profile
 * 7. Store Page Token + IG Account ID in cookie
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");

  // Auto-detect base URL
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = host ? `${proto}://${host}` : (process.env.NEXTAUTH_URL || "http://localhost:3002");

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

  const appId = process.env.FACEBOOK_APP_ID || "";
  const appSecret = process.env.FACEBOOK_APP_SECRET || "";
  // Must match exactly what connect route sent
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || (() => {
    if (host) return `${proto}://${host}/api/instagram/callback`;
    return `${new URL(request.url).origin}/api/instagram/callback`;
  })();

  try {
    // Step 1: Exchange code for Facebook User Access Token
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      console.error("Facebook token exchange failed:", err);
      return NextResponse.redirect(
        new URL("/settings?ig_error=token_exchange_failed", baseUrl)
      );
    }

    const tokenData = await tokenRes.json();
    const shortLivedToken = tokenData.access_token;
    console.log("Facebook short-lived token obtained");

    // Step 2: Exchange for long-lived User Token (60 days)
    const longLivedUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedUrl.searchParams.set("client_id", appId);
    longLivedUrl.searchParams.set("client_secret", appSecret);
    longLivedUrl.searchParams.set("fb_exchange_token", shortLivedToken);

    const longLivedRes = await fetch(longLivedUrl.toString());
    const longLivedData = await longLivedRes.json();
    const longLivedUserToken = longLivedData.access_token || shortLivedToken;
    console.log("Long-lived user token obtained");

    // Debug: Check what permissions the token has
    const debugRes = await fetch(
      `https://graph.facebook.com/v21.0/me/permissions?access_token=${longLivedUserToken}`
    );
    const debugData = await debugRes.json();
    console.log("Token permissions:", JSON.stringify(debugData));

    // Step 3: Fetch Facebook Pages to find linked Instagram Business Account
    // Try /me/accounts first, then /me?fields=accounts{...} as fallback
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longLivedUserToken}`
    );
    let pagesData = await pagesRes.json();
    console.log("Facebook /me/accounts response:", JSON.stringify(pagesData, null, 2));

    // Fallback 1: try /me?fields=accounts{...}
    if (!pagesData.data || pagesData.data.length === 0) {
      console.log("Trying fallback 1: /me?fields=accounts...");
      const fallbackRes = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=accounts{id,name,access_token,instagram_business_account}&access_token=${longLivedUserToken}`
      );
      const fallbackData = await fallbackRes.json();
      console.log("Fallback 1 response:", JSON.stringify(fallbackData, null, 2));
      if (fallbackData.accounts?.data?.length > 0) {
        pagesData = fallbackData.accounts;
      }
    }

    // Fallback 2: try querying known Page directly by ID (for Business Portfolio-owned Pages)
    if (!pagesData.data || pagesData.data.length === 0) {
      console.log("Trying fallback 2: direct Page query by known ID...");
      // When a Page is managed via Business Portfolio, /me/accounts returns empty.
      // But we can query the Page directly by ID if the user has access.
      const knownPageIds = [
        "980300588507807", // Decele.app
      ];

      for (const pageId of knownPageIds) {
        try {
          const directRes = await fetch(
            `https://graph.facebook.com/v21.0/${pageId}?fields=id,name,access_token,instagram_business_account&access_token=${longLivedUserToken}`
          );
          const directData = await directRes.json();
          console.log(`Direct page query for ${pageId}:`, JSON.stringify(directData, null, 2));

          if (directData.access_token && directData.instagram_business_account) {
            pagesData = { data: [directData] };
            console.log("Found page via direct ID query!");
            break;
          }
        } catch (e) {
          console.warn(`Direct page query failed for ${pageId}:`, e);
        }
      }

    }

    // Fallback 3: Try using the user token directly to query the IG business account
    // via /me?fields=instagram_business_account (works if user has instagram_basic permission)
    if (!pagesData.data || pagesData.data.length === 0) {
      console.log("Trying fallback 3: /me?fields=instagram_business_account...");
      const igDirectRes = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id,name,instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count,biography}&access_token=${longLivedUserToken}`
      );
      const igDirectData = await igDirectRes.json();
      console.log("Fallback 3 (/me?fields=instagram_business_account):", JSON.stringify(igDirectData, null, 2));

      if (igDirectData.instagram_business_account) {
        // We got the IG account directly — use the user token as access token
        const igAccount = igDirectData.instagram_business_account as Record<string, unknown>;
        const igAccountId = String(igAccount.id || "");
        const username = String(igAccount.username || "");

        if (igAccountId && username) {
          console.log("Found IG Business Account directly:", igAccountId, username);

          const expiresIn = longLivedData.expires_in || 5184000;
          const igCredentials = {
            igAccountId,
            accessToken: longLivedUserToken, // Use the long-lived user token
            username,
            name: String(igAccount.name || ""),
            profilePicUrl: String(igAccount.profile_picture_url || ""),
            followersCount: Number(igAccount.followers_count) || 0,
            mediaCount: Number(igAccount.media_count) || 0,
            bio: String(igAccount.biography || ""),
            facebookPageId: "",
            facebookPageName: igDirectData.name || "",
            connectedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
          };

          const encoded = Buffer.from(JSON.stringify(igCredentials)).toString("base64");
          cookieStore.set("ig_credentials", encoded, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 55,
            path: "/",
          });

          return NextResponse.redirect(
            new URL(
              `/settings?ig_connected=true&ig_username=${encodeURIComponent(username)}`,
              baseUrl
            )
          );
        }
      }
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      console.error("No Facebook Pages found. Full response:", JSON.stringify(pagesData));
      const debugInfo = `no_pages|perms:${JSON.stringify(debugData?.data?.map((p: Record<string,string>) => p.permission))}|accounts:${JSON.stringify(pagesData)}`;
      return NextResponse.redirect(
        new URL(`/settings?ig_error=${encodeURIComponent(debugInfo)}`, baseUrl)
      );
    }

    // Find the first page with a linked Instagram Business Account
    const pageWithIg = pagesData.data.find(
      (page: Record<string, unknown>) => page.instagram_business_account
    );

    if (!pageWithIg) {
      console.error("No Instagram Business Account linked to any Facebook Page");
      return NextResponse.redirect(
        new URL("/settings?ig_error=no_instagram_account", baseUrl)
      );
    }

    const pageToken = pageWithIg.access_token as string; // Long-lived Page Token
    const igAccountId = String(
      (pageWithIg.instagram_business_account as Record<string, unknown>)?.id || ""
    );
    const facebookPageId = String(pageWithIg.id);
    const facebookPageName = String(pageWithIg.name || "");

    console.log("Found Instagram Business Account:", igAccountId, "on Page:", facebookPageName);

    // Step 4: Fetch Instagram Business Account profile using Page Token
    const profileRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}?fields=id,username,name,profile_picture_url,followers_count,media_count,biography&access_token=${pageToken}`
    );
    const profile = await profileRes.json();
    console.log("Instagram profile:", JSON.stringify(profile, null, 2));

    const username = profile.username || "";
    if (!username) {
      console.error("No username in IG Business profile:", profile);
      return NextResponse.redirect(
        new URL("/settings?ig_error=no_business_account", baseUrl)
      );
    }

    // Step 5: Store credentials in cookie
    // Page tokens from long-lived user tokens don't expire (until user revokes)
    const expiresIn = longLivedData.expires_in || 5184000; // 60 days for user token
    const igCredentials = {
      igAccountId,
      accessToken: pageToken, // PAGE token — enables business_discovery
      username,
      name: profile.name || "",
      profilePicUrl: profile.profile_picture_url || "",
      followersCount: profile.followers_count || 0,
      mediaCount: profile.media_count || 0,
      bio: profile.biography || "",
      facebookPageId,
      facebookPageName,
      connectedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };

    console.log("Instagram Business Account connected via Facebook Login:", {
      username: igCredentials.username,
      followers: igCredentials.followersCount,
      igAccountId,
      facebookPage: facebookPageName,
    });

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
