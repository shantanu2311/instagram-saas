import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const asset = await prisma.mediaAsset.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.mediaAsset.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body is required." },
      { status: 400 }
    );
  }

  const asset = await prisma.mediaAsset.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.tags !== undefined) {
    if (
      !Array.isArray(body.tags) ||
      body.tags.some(
        (t: unknown) => typeof t !== "string" || (t as string).length > 100
      )
    ) {
      return NextResponse.json(
        { error: "Tags must be an array of strings (max 100 chars each)" },
        { status: 400 }
      );
    }
    if (body.tags.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 tags allowed" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.mediaAsset.update({
    where: { id },
    data: {
      tags: body.tags !== undefined ? body.tags : undefined,
    },
  });

  return NextResponse.json(updated);
}
