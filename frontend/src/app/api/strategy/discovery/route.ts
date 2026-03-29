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
  let body: { brandId?: string; profile?: any };
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

  const { brandId, profile } = body;
  if (!brandId || !profile) {
    return NextResponse.json(
      { error: "brandId and profile are required." },
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

    // Upsert discovery profile (one per brand)
    const saved = await prisma.discoveryProfile.upsert({
      where: { brandId },
      create: {
        brandId,
        data: profile,
      },
      update: {
        data: profile,
      },
    });

    return NextResponse.json({ id: saved.id, status: "saved" });
  } catch (err) {
    console.error("Discovery save error:", err);
    return NextResponse.json(
      { error: "Failed to save discovery profile." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the user's first brand's discovery profile
    const brand = await prisma.brand.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!brand) {
      return NextResponse.json({ profile: null, strategy: null });
    }

    const discovery = await prisma.discoveryProfile.findUnique({
      where: { brandId: brand.id },
    });

    // Optionally include saved strategy data
    const url = new URL(request.url);
    const includeStrategy = url.searchParams.get("includeStrategy") === "true";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let strategyData: any = null;
    if (includeStrategy) {
      const strat = await prisma.strategy.findUnique({
        where: { brandId: brand.id },
      });
      strategyData = strat?.data || null;
    }

    return NextResponse.json({
      profile: discovery?.data || null,
      id: discovery?.id || null,
      ...(includeStrategy ? { strategy: strategyData } : {}),
    });
  } catch (err) {
    console.error("Discovery fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch discovery profile." },
      { status: 500 }
    );
  }
}
