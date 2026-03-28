import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/billing/subscription/${session.user.id}`
    );

    if (!res.ok) {
      console.error("Subscription backend error:", res.status);
      return NextResponse.json(
        { error: "Billing service unavailable." },
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
