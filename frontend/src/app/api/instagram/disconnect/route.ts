import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Disconnects the Instagram account by clearing the stored credentials.
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("ig_credentials");

  return NextResponse.json({ disconnected: true });
}

// Also support GET for simple redirect-based disconnect
export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("ig_credentials");
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return NextResponse.redirect(
    new URL("/settings?ig_disconnected=true", baseUrl)
  );
}
