import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { VALID_IDEA_STATUSES, VALID_CONTENT_TYPES } from "@/lib/constants";

export async function GET(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const pillar = url.searchParams.get("pillar");
  const contentType = url.searchParams.get("contentType");

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!brand) return NextResponse.json([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { brandId: brand.id };
  if (status && VALID_IDEA_STATUSES.includes(status as any)) {
    where.status = status;
  }
  if (pillar) where.pillar = pillar;
  if (contentType && VALID_CONTENT_TYPES.includes(contentType as any)) {
    where.contentType = contentType;
  }

  const ideas = await prisma.contentIdea.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(ideas);
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  if (!body.title?.trim())
    return NextResponse.json({ error: "Title is required" }, { status: 400 });

  // Strip null bytes that PostgreSQL cannot store
  const sanitizedTitle = String(body.title).replace(/\0/g, "").trim().slice(0, 200);
  if (!sanitizedTitle)
    return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!brand)
    return NextResponse.json(
      { error: "Create a brand first" },
      { status: 400 }
    );

  const idea = await prisma.contentIdea.create({
    data: {
      brandId: brand.id,
      title: sanitizedTitle,
      description: body.description ? String(body.description).replace(/\0/g, "") : null,
      sourceUrl: body.sourceUrl ? String(body.sourceUrl).replace(/\0/g, "") : null,
      sourceType: body.sourceType || "manual",
      contentType: body.contentType || null,
      pillar: body.pillar || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      notes: body.notes ? String(body.notes).replace(/\0/g, "") : null,
    },
  });
  return NextResponse.json(idea);
}
