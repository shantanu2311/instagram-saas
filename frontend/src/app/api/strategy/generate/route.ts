import { NextResponse } from "next/server";
import { generateStrategy } from "@/lib/content-engine";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(request, "generate");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    if (!body.businessName && !body.businessDescription && !body.goals) {
      return NextResponse.json(
        { error: "Discovery data is required. Please complete the discovery questionnaire first." },
        { status: 400 }
      );
    }

    // Fetch collateral context from DB
    let collateralContext: string | undefined;
    try {
      const brand = await prisma.brand.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (brand) {
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

        if (collaterals.length > 0) {
          const parts: string[] = [];
          for (const c of collaterals) {
            parts.push(`[${c.filename} (${c.fileType})]: ${c.aiSummary || "No summary"}`);
            // Include truncated extracted text
            if (c.extractedText) {
              parts.push(c.extractedText.slice(0, 3000));
            }
          }
          collateralContext = parts.join("\n\n").slice(0, 15_000);
        }
      }
    } catch {
      // Ignore collateral fetch errors — strategy gen should still work
    }

    const strategy = await generateStrategy({
      accountType: body.accountType || "business",
      businessName: body.businessName || "",
      businessDescription: body.businessDescription || "",
      productService: body.productService || "",
      targetDemographics: body.targetDemographics || [],
      targetLocation: body.targetLocation || "",
      targetAgeMin: body.targetAgeMin || 18,
      targetAgeMax: body.targetAgeMax || 45,
      competitors: body.competitors || [],
      goals: body.goals || [],
      contentPreferences: body.contentPreferences || [],
      usp: body.usp || "",
      keyDifferentiators: body.keyDifferentiators || [],
      painPoints: body.painPoints || [],
      brandPersonality: body.brandPersonality || [],
      postingHistory: body.postingHistory || "",
      ambition: body.ambition || "",
      monetizationGoal: body.monetizationGoal || "",
      instagramHandle: body.instagramHandle || "",
      collateralContext,
      deepDiveAnswers: body.deepDiveAnswers || undefined,
      researchResults: body.researchResults || undefined,
    });

    return NextResponse.json(strategy);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Strategy generation failed";
    console.error("Strategy generate error:", message);

    if (message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "Set ANTHROPIC_API_KEY in frontend/.env to enable AI strategy generation." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
