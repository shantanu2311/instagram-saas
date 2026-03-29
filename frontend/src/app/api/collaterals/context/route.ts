import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Returns aggregated context from all processed collaterals for a brand.
 * Used by the strategy generator to enrich the strategy with uploaded business materials.
 */
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
      return NextResponse.json({ context: null });
    }

    const collaterals = await prisma.collateral.findMany({
      where: {
        brandId: brand.id,
        status: "processed",
        extractedText: { not: null },
      },
      select: {
        filename: true,
        fileType: true,
        aiSummary: true,
        extractedText: true,
        autoPopulated: true,
      },
    });

    if (collaterals.length === 0) {
      return NextResponse.json({ context: null });
    }

    // Build aggregated context string for strategy generation
    const summaries = collaterals
      .map((c) => `[${c.filename} (${c.fileType})]: ${c.aiSummary || "No summary"}`)
      .join("\n");

    // Collect brand context from all analyses
    const allBrandContext: Array<{ additionalInfo: string; keyFacts: string[]; toneIndicators: string[] }> = [];
    for (const c of collaterals) {
      const ap = c.autoPopulated as { brandContext?: { additionalInfo: string; keyFacts: string[]; toneIndicators: string[] } } | null;
      if (ap?.brandContext) {
        allBrandContext.push(ap.brandContext);
      }
    }

    // Combine key facts and tone indicators
    const keyFacts = [...new Set(allBrandContext.flatMap((bc) => bc.keyFacts))];
    const toneIndicators = [...new Set(allBrandContext.flatMap((bc) => bc.toneIndicators))];
    const additionalInfo = allBrandContext
      .map((bc) => bc.additionalInfo)
      .filter(Boolean)
      .join(" ");

    // Truncate extracted texts for strategy prompt
    const extractedTexts = collaterals
      .map((c) => {
        const text = c.extractedText || "";
        return `--- ${c.filename} ---\n${text.slice(0, 5000)}`;
      })
      .join("\n\n")
      .slice(0, 20_000);

    return NextResponse.json({
      context: {
        fileCount: collaterals.length,
        summaries,
        keyFacts,
        toneIndicators,
        additionalInfo,
        extractedTexts,
      },
    });
  } catch (err) {
    console.error("Collateral context error:", err);
    return NextResponse.json(
      { error: "Failed to fetch collateral context." },
      { status: 500 }
    );
  }
}
