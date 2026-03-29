import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimit(request, "default");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const brand = await prisma.brand.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!brand) {
      return NextResponse.json({ collaterals: [] });
    }

    const collaterals = await prisma.collateral.findMany({
      where: { brandId: brand.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        fileType: true,
        status: true,
        aiSummary: true,
        autoPopulated: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ collaterals });
  } catch (err) {
    console.error("Collaterals fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch collaterals." },
      { status: 500 }
    );
  }
}
