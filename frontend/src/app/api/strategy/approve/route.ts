import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/strategy/${body.strategyId}/approve`, {
      method: "PUT",
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
        status: "approved",
        mock: true,
        message: "Strategy approved (mock)",
      });
    }
    return NextResponse.json(
      { error: "Strategy service unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
