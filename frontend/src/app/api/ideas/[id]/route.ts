import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { VALID_IDEA_STATUSES } from "@/lib/constants";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

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

  const idea = await prisma.contentIdea.findFirst({
    where: { id },
    include: { brand: { select: { userId: true } } },
  });
  if (!idea || idea.brand.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.status && !VALID_IDEA_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `Invalid status. Allowed: ${VALID_IDEA_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const updated = await prisma.contentIdea.update({
    where: { id },
    data: {
      title: body.title?.trim() || idea.title,
      description:
        body.description !== undefined ? body.description : idea.description,
      sourceUrl:
        body.sourceUrl !== undefined ? body.sourceUrl : idea.sourceUrl,
      sourceType:
        body.sourceType !== undefined ? body.sourceType : idea.sourceType,
      contentType:
        body.contentType !== undefined ? body.contentType : idea.contentType,
      pillar: body.pillar !== undefined ? body.pillar : idea.pillar,
      tags:
        body.tags !== undefined
          ? Array.isArray(body.tags)
            ? body.tags
            : idea.tags
          : idea.tags,
      notes: body.notes !== undefined ? body.notes : idea.notes,
      status: body.status || idea.status,
      usedAt: body.status === "used" ? new Date() : idea.usedAt,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const idea = await prisma.contentIdea.findFirst({
    where: { id },
    include: { brand: { select: { userId: true } } },
  });
  if (!idea || idea.brand.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.contentIdea.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
