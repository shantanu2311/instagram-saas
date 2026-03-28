import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
  });
  if (!brand) return NextResponse.json([]);

  const moments = await prisma.brandMoment.findMany({
    where: { brandId: brand.id },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(moments);
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body is required." },
      { status: 400 }
    );
  }

  if (!body.title?.trim())
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!body.date)
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  if (!body.type)
    return NextResponse.json({ error: "Type is required" }, { status: 400 });

  const validTypes = [
    "launch",
    "event",
    "milestone",
    "collaboration",
    "seasonal",
  ];
  if (!validTypes.includes(body.type))
    return NextResponse.json(
      { error: `Invalid type. Allowed: ${validTypes.join(", ")}` },
      { status: 400 }
    );

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
  });
  if (!brand)
    return NextResponse.json(
      { error: "Create a brand first" },
      { status: 400 }
    );

  const moment = await prisma.brandMoment.create({
    data: {
      brandId: brand.id,
      title: body.title.trim(),
      description: body.description || null,
      date: new Date(body.date),
      type: body.type,
      isRecurring: body.isRecurring || false,
      color: body.color || null,
    },
  });
  return NextResponse.json(moment);
}
