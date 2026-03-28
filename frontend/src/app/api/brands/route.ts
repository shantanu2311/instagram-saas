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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body is required." }, { status: 400 });
  }

  const userId = session.user.id;

  const brandData = {
    niche: (body.niche as string) || "",
    primaryColor: (body.primaryColor as string) || "#8b5cf6",
    secondaryColor: (body.secondaryColor as string) || "#ec4899",
    accentColor: (body.accentColor as string) || "#f59e0b",
    fontHeadline: (body.fontHeadline as string) || "Inter",
    fontBody: (body.fontBody as string) || "Inter",
    toneFormality: typeof body.toneFormality === "number" ? body.toneFormality : 50,
    toneHumor: typeof body.toneHumor === "number" ? body.toneHumor : 50,
    voiceDescription: (body.voiceDescription as string) || null,
    sampleCaption: Array.isArray(body.sampleCaptions)
      ? JSON.stringify(body.sampleCaptions)
      : null,
    contentPillars: body.contentPillars || [],
    postingDays: body.postingDays || {},
    postsPerWeek: typeof body.postsPerWeek === "number" ? body.postsPerWeek : 5,
    brandHashtag: (body.brandHashtag as string) || null,
  };

  try {
    const existing = await prisma.brand.findFirst({ where: { userId } });

    let brand;
    if (existing) {
      brand = await prisma.brand.update({
        where: { id: existing.id },
        data: brandData,
      });
    } else {
      brand = await prisma.brand.create({
        data: {
          userId,
          name: (body.brandHashtag as string) || (body.niche as string) || "My Brand",
          ...brandData,
        },
      });
    }

    return NextResponse.json({
      id: brand.id,
      name: brand.name,
      niche: brand.niche,
    });
  } catch (err) {
    console.error("Brand save error:", err);
    return NextResponse.json(
      { error: "Failed to create brand" },
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

  const brands = await prisma.brand.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      niche: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      fontHeadline: true,
      fontBody: true,
      toneFormality: true,
      toneHumor: true,
      voiceDescription: true,
      sampleCaption: true,
      contentPillars: true,
      postingDays: true,
      postsPerWeek: true,
      brandHashtag: true,
    },
  });

  return NextResponse.json(brands);
}
