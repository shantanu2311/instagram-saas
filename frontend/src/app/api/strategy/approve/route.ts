import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: { brandId?: string; strategy?: any };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body is required." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const { brandId, strategy } = body;
  if (!brandId || !strategy) {
    return NextResponse.json(
      { error: "brandId and strategy are required." },
      { status: 400 }
    );
  }

  try {
    // Verify brand ownership
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: session.user.id },
    });
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Upsert strategy (one per brand)
    const saved = await prisma.strategy.upsert({
      where: { brandId },
      create: {
        brandId,
        data: strategy,
        status: "active",
      },
      update: {
        data: strategy,
        status: "active",
      },
    });

    return NextResponse.json({ id: saved.id, status: "approved" });
  } catch (err) {
    console.error("Strategy approve error:", err);
    return NextResponse.json(
      { error: "Failed to save strategy." },
      { status: 500 }
    );
  }
}
