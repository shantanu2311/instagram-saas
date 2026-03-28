import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/strategy/trends`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Trends backend error:", res.status, error);
      return NextResponse.json(
        { error: "Failed to fetch trends. Please try again." },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Trends service unavailable. Please try again later." },
      { status: 503 }
    );
  }
}

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/strategy/trends`);
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Trends service unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
