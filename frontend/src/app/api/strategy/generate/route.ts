import { NextResponse } from "next/server";
import { generateStrategy } from "@/lib/content-engine";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getInstagramCredentials } from "@/lib/instagram-token";
import { analyzeOwnPage } from "@/lib/content-engine/instagram-graph-api";

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

    // Fetch products, moments, and ideas for richer strategy generation
    let products: Array<{ name: string; description: string | null; category: string | null; price: number | null }> = [];
    let moments: Array<{ title: string; type: string; date: Date; description: string | null }> = [];
    let ideas: Array<{ title: string; contentType: string | null; pillar: string | null; notes: string | null }> = [];
    try {
      const brand = await prisma.brand.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (brand) {
        [products, moments, ideas] = await Promise.all([
          prisma.product.findMany({
            where: { brandId: brand.id },
            select: { name: true, description: true, category: true, price: true },
            take: 50,
          }),
          prisma.brandMoment.findMany({
            where: { brandId: brand.id },
            select: { title: true, type: true, date: true, description: true },
            take: 30,
          }),
          prisma.contentIdea.findMany({
            where: { brandId: brand.id, status: "new" },
            select: { title: true, contentType: true, pillar: true, notes: true },
            take: 30,
          }),
        ]);
      }
    } catch {
      // Non-fatal — strategy gen still works without these
    }

    // Analyze user's own Instagram page if connected
    let instagramPageAnalysis: Parameters<typeof generateStrategy>[0]["instagramPageAnalysis"];
    try {
      const igCreds = await getInstagramCredentials();
      if (igCreds) {
        const analysis = await analyzeOwnPage(
          { accessToken: igCreds.accessToken, igUserId: igCreds.igAccountId },
          igCreds.followersCount || undefined
        );
        if (analysis) {
          instagramPageAnalysis = analysis;
        }
      }
    } catch {
      // Non-fatal — strategy gen still works without IG page analysis
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
      products: products.length > 0 ? products.map(p => ({
        name: p.name,
        description: p.description || "",
        category: p.category || "",
        price: p.price != null ? String(p.price) : undefined,
      })) : undefined,
      moments: moments.length > 0 ? moments.map(m => ({
        title: m.title,
        type: m.type,
        date: m.date.toISOString().split("T")[0],
        description: m.description || "",
      })) : undefined,
      ideas: ideas.length > 0 ? ideas.map(i => ({
        title: i.title,
        contentType: i.contentType ?? undefined,
        pillar: i.pillar ?? undefined,
        notes: i.notes ?? undefined,
      })) : undefined,
      instagramPageAnalysis: instagramPageAnalysis || undefined,
      deepDiveAnswers: body.deepDiveAnswers || undefined,
      researchResults: body.researchResults || undefined,
    });

    return NextResponse.json(strategy);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Strategy generation failed";
    console.error("Strategy generate error:", message);

    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "Set OPENAI_API_KEY in frontend/.env to enable AI strategy generation." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
