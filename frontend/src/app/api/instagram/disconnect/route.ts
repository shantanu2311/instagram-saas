import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Disconnects the Instagram account by clearing the stored credentials.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.delete("ig_credentials");

  return NextResponse.json({ disconnected: true });
}

// Also support GET for simple redirect-based disconnect
export async function GET() {
  const session = await auth();
  const cookieStore = await cookies();

  if (!session?.user?.id) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL("/auth/signin", baseUrl));
  }

  cookieStore.delete("ig_credentials");
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return NextResponse.redirect(
    new URL("/settings?ig_disconnected=true", baseUrl)
  );
}
