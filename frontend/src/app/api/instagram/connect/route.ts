import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/instagram/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: "Instagram app not configured. Set INSTAGRAM_CLIENT_ID in .env" },
      { status: 500 }
    );
  }

  const authUrl = new URL("https://www.instagram.com/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set(
    "scope",
    "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement"
  );
  authUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(authUrl.toString());
}
