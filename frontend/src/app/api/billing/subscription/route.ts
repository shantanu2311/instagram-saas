import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    // Default to a placeholder user_id; in production, extract from session
    const userId = url.searchParams.get("user_id") || "current";
    const res = await fetch(`${BACKEND_URL}/billing/subscription/${userId}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Backend not available" }, { status: 503 });
  }
}
