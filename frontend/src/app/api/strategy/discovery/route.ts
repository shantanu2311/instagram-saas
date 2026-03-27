import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/strategy/discovery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json(
        { error: `Backend error: ${error}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      status: "saved",
      mock: true,
      profileId: "mock-profile-1",
      message: "Discovery profile saved (mock)",
    });
  }
}

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/strategy/discovery`);
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      mock: true,
      profiles: [],
    });
  }
}
