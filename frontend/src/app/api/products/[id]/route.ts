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

  const product = await prisma.product.findFirst({
    where: { id },
    include: { brand: { select: { userId: true } } },
  });
  if (!product || product.brand.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: body.name?.trim() || product.name,
      description:
        body.description !== undefined ? body.description : product.description,
      category:
        body.category !== undefined ? body.category : product.category,
      price:
        body.price !== undefined
          ? body.price
            ? parseFloat(body.price)
            : null
          : product.price,
      imageUrl:
        body.imageUrl !== undefined ? body.imageUrl : product.imageUrl,
      usps: body.usps !== undefined ? body.usps : product.usps,
      isActive:
        body.isActive !== undefined ? body.isActive : product.isActive,
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

  const product = await prisma.product.findFirst({
    where: { id },
    include: { brand: { select: { userId: true } } },
  });
  if (!product || product.brand.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
