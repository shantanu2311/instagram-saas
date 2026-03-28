import { NextResponse } from "next/server";
import { getInstagramCredentials } from "@/lib/instagram-token";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Returns the current Instagram connection status.
 * Used by the settings page and research page to show data source.
 */
export async function GET(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creds = await getInstagramCredentials();

  if (!creds) {
    return NextResponse.json({ connected: false });
  }

  // If using env credentials with no profile info, fetch it from the API
  if (creds.source === "env" && !creds.username) {
    try {
      const res = await fetch(
        `https://graph.instagram.com/v21.0/me?fields=user_id,username,name,profile_picture_url,followers_count&access_token=${creds.accessToken}`
      );
      if (res.ok) {
        const profile = await res.json();
        return NextResponse.json({
          connected: true,
          username: profile.username || "",
          name: profile.name || "",
          profilePicUrl: profile.profile_picture_url || "",
          followersCount: profile.followers_count || 0,
          igAccountId: creds.igAccountId,
          source: "env",
        });
      }
    } catch {
      // Fall through to basic response
    }
  }

  return NextResponse.json({
    connected: true,
    username: creds.username,
    name: creds.name,
    profilePicUrl: creds.profilePicUrl,
    followersCount: creds.followersCount,
    igAccountId: creds.igAccountId,
    connectedAt: creds.connectedAt,
    expiresAt: creds.expiresAt,
    source: creds.source,
  });
}
