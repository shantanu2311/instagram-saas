import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const weekStart = url.searchParams.get("weekStart");
  if (!weekStart) return NextResponse.json({ error: "weekStart required" }, { status: 400 });

  const brand = await prisma.brand.findFirst({ where: { userId: session.user.id } });
  if (!brand) return NextResponse.json(null);

  const brief = await prisma.weeklyBrief.findUnique({
    where: { brandId_weekStartDate: { brandId: brand.id, weekStartDate: new Date(weekStart) } },
  });
  return NextResponse.json(brief);
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Body required" }, { status: 400 }); }

  const brand = await prisma.brand.findFirst({ where: { userId: session.user.id } });
  if (!brand) return NextResponse.json({ error: "Create a brand first" }, { status: 400 });

  const weekStartDate = new Date(body.weekStartDate);

  const brief = await prisma.weeklyBrief.upsert({
    where: { brandId_weekStartDate: { brandId: brand.id, weekStartDate } },
    create: {
      brandId: brand.id,
      weekStartDate,
      launches: body.launches || null,
      events: body.events || null,
      trendingTopics: body.trendingTopics || null,
    },
    update: {
      launches: body.launches || null,
      events: body.events || null,
      trendingTopics: body.trendingTopics || null,
    },
  });
  return NextResponse.json(brief);
}
