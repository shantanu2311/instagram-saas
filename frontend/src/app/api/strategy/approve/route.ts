import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function PUT(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/strategy/${body.strategyId}/approve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Approve backend error:", res.status, error);
      return NextResponse.json(
        { error: "Failed to approve strategy. Please try again." },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Strategy service unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
