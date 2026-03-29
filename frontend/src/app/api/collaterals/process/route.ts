import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { analyzeCollateral } from "@/lib/content-engine/collateral-analyzer";

export async function POST(request: Request) {
  const limited = rateLimit(request, "generate");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { collateralId?: string };
  try {
    body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Request body is required." }, { status: 400 });
  }

  const { collateralId } = body;
  if (!collateralId) {
    return NextResponse.json(
      { error: "collateralId is required." },
      { status: 400 }
    );
  }

  try {
    // Get collateral with brand ownership check
    const collateral = await prisma.collateral.findFirst({
      where: {
        id: collateralId,
        brand: { userId: session.user.id },
      },
    });

    if (!collateral) {
      return NextResponse.json({ error: "Collateral not found" }, { status: 404 });
    }

    if (!collateral.extractedText) {
      return NextResponse.json(
        { error: "No extracted text available for this file." },
        { status: 400 }
      );
    }

    // Update status to processing
    await prisma.collateral.update({
      where: { id: collateralId },
      data: { status: "processing" },
    });

    // Run AI analysis
    const analysis = await analyzeCollateral(
      collateral.extractedText,
      collateral.filename,
      collateral.fileType
    );

    // Auto-populate products to DB
    if (analysis.products.length > 0) {
      for (const p of analysis.products) {
        await prisma.product.create({
          data: {
            brandId: collateral.brandId,
            name: p.name.slice(0, 255),
            description: p.description || null,
            category: p.category || null,
            price: p.price || null,
            currency: p.currency || "USD",
            usps: p.usps || [],
          },
        }).catch(() => {}); // Ignore duplicates
      }
    }

    // Auto-populate moments to DB
    if (analysis.moments.length > 0) {
      for (const m of analysis.moments) {
        const date = m.date ? new Date(m.date) : new Date();
        if (isNaN(date.getTime())) continue;
        await prisma.brandMoment.create({
          data: {
            brandId: collateral.brandId,
            title: m.title.slice(0, 255),
            description: m.description || null,
            date,
            type: m.type || "milestone",
          },
        }).catch(() => {});
      }
    }

    // Auto-populate inspiration ideas to DB
    if (analysis.inspiration.length > 0) {
      for (const idea of analysis.inspiration) {
        await prisma.contentIdea.create({
          data: {
            brandId: collateral.brandId,
            title: idea.title.slice(0, 255),
            description: idea.description || null,
            sourceType: "manual",
            contentType: idea.contentType || null,
            pillar: idea.pillar || null,
            status: "new",
          },
        }).catch(() => {});
      }
    }

    // Save analysis results
    await prisma.collateral.update({
      where: { id: collateralId },
      data: {
        status: "processed",
        aiSummary: analysis.summary,
        autoPopulated: {
          products: analysis.products,
          moments: analysis.moments,
          inspiration: analysis.inspiration,
          brandContext: analysis.brandContext,
        },
      },
    });

    return NextResponse.json({
      id: collateralId,
      summary: analysis.summary,
      autoPopulated: {
        products: analysis.products.length,
        moments: analysis.moments.length,
        inspiration: analysis.inspiration.length,
      },
      brandContext: analysis.brandContext,
    });
  } catch (err) {
    console.error("Collateral process error:", err);
    // Mark as failed
    await prisma.collateral.update({
      where: { id: collateralId },
      data: { status: "failed" },
    }).catch(() => {});

    return NextResponse.json(
      { error: "Failed to process collateral." },
      { status: 500 }
    );
  }
}
