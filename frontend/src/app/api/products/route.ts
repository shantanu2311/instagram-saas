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

  const products = await prisma.product.findMany({
    where: { brandId: brand.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
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

  if (!body.name?.trim())
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
  });
  if (!brand)
    return NextResponse.json(
      { error: "Create a brand first" },
      { status: 400 }
    );

  const product = await prisma.product.create({
    data: {
      brandId: brand.id,
      name: body.name.trim(),
      description: body.description || null,
      category: body.category || null,
      price: body.price ? parseFloat(body.price) : null,
      imageUrl: body.imageUrl || null,
      usps: body.usps || [],
    },
  });
  return NextResponse.json(product);
}
