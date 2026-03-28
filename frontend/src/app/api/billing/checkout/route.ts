import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/billing/create-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, userId: session.user.id }),
    });

    if (!res.ok) {
      console.error("Checkout backend error:", res.status);
      return NextResponse.json(
        { error: "Checkout service unavailable." },
        { status: res.status }
      );
    }

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(
      { error: "Billing service unavailable." },
      { status: 503 }
    );
  }
}
