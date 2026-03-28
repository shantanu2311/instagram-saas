import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body is required." },
      { status: 400 }
    );
  }

  const moment = await prisma.brandMoment.findFirst({
    where: { id },
    include: { brand: { select: { userId: true } } },
  });
  if (!moment || moment.brand.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const validTypes = [
    "launch",
    "event",
    "milestone",
    "collaboration",
    "seasonal",
  ];
  if (body.type && !validTypes.includes(body.type)) {
    return NextResponse.json(
      { error: `Invalid type. Allowed: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  const updated = await prisma.brandMoment.update({
    where: { id },
    data: {
      title: body.title?.trim() || moment.title,
      description:
        body.description !== undefined
          ? body.description
          : moment.description,
      date: body.date ? new Date(body.date) : moment.date,
      type: body.type || moment.type,
      isRecurring:
        body.isRecurring !== undefined
          ? body.isRecurring
          : moment.isRecurring,
      color: body.color !== undefined ? body.color : moment.color,
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

  const moment = await prisma.brandMoment.findFirst({
    where: { id },
    include: { brand: { select: { userId: true } } },
  });
  if (!moment || moment.brand.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.brandMoment.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
