import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { seedHashtagsFromStrategy } from "@/lib/content-engine/hashtag-seeder";
import { getInstagramCredentials } from "@/lib/instagram-token";

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
    const now = new Date();
    const nextReview = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check if existing strategy exists for cycle increment
    const existing = await prisma.strategy.findUnique({
      where: { brandId },
      select: { cycleNumber: true },
    });

    const saved = await prisma.strategy.upsert({
      where: { brandId },
      create: {
        brandId,
        data: strategy,
        status: "active",
        approvedAt: now,
        nextReviewAt: nextReview,
        cycleNumber: 1,
      },
      update: {
        data: strategy,
        status: "active",
        approvedAt: now,
        nextReviewAt: nextReview,
        cycleNumber: (existing?.cycleNumber || 0) + 1,
      },
    });

    // Fire-and-forget: seed hashtag cache from strategy
    const igCreds = await getInstagramCredentials();
    if (igCreds) {
      seedHashtagsFromStrategy(brandId, strategy, brand.niche, {
        accessToken: igCreds.accessToken,
        igAccountId: igCreds.igAccountId,
      }).catch((err) => console.error("Hashtag seeding failed:", err));
    }

    return NextResponse.json({ id: saved.id, status: "approved" });
  } catch (err) {
    console.error("Strategy approve error:", err);
    return NextResponse.json(
      { error: "Failed to save strategy." },
      { status: 500 }
    );
  }
}
