import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/strategy/research`, {
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
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        status: "started",
        mock: true,
        researchId: "mock-research-1",
        message: "Research started (mock)",
      });
    }
    return NextResponse.json(
      { error: "Research service unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
