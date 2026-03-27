import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/settings?ig_error=denied", request.url));
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID || "";
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || "";
  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/instagram/callback`;

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/settings?ig_error=token_failed", request.url));
    }

    const tokenData = await tokenRes.json();
    const shortLivedToken = tokenData.access_token;
    const igUserId = String(tokenData.user_id);

    // Exchange for long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`
    );

    const longLivedData = await longLivedRes.json();
    const accessToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || 5184000; // 60 days

    // Get user profile
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
    );
    const profile = await profileRes.json();

    // TODO: Store in Prisma InstagramAccount table
    // For now, log the connection (temporary)
    console.log("Instagram connected:", {
      igUserId,
      username: profile.username,
      mediaCount: profile.media_count,
      expiresIn,
    });

    return NextResponse.redirect(new URL("/settings?ig_connected=true", request.url));
  } catch (err) {
    console.error("Instagram OAuth error:", err);
    return NextResponse.redirect(new URL("/settings?ig_error=unknown", request.url));
  }
}
