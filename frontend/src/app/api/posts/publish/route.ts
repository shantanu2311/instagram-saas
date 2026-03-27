import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body is required." },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND_URL}/posts/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(
      { error: "Backend not available", status: "error" },
      { status: 503 }
    );
  }
}
