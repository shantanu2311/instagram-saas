import { NextResponse } from "next/server";
import {
  generateCaption,
  type BrandContext,
  type StrategyContext,
  type ProductContext,
  type MomentContext,
} from "@/lib/content-engine";
import { prisma } from "@/lib/db";
import {
  generateImage,
  buildBackendBrand,
  buildFactCardTemplate,
  buildCarouselTemplate,
  mediaUrl,
} from "@/lib/backend-client";
import { auth } from "@/lib/auth";
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

    if (!body.topic || typeof body.topic !== "string" || !body.topic.trim()) {
      return NextResponse.json(
        { error: "A topic is required to generate content." },
        { status: 400 }
      );
    }

    // Sanitize topic: strip null bytes, HTML tags, and truncate
    body.topic = body.topic
      .replace(/\0/g, "")
      .replace(/<[^>]*>/g, "")
      .slice(0, 500);

    // Build brand context from request
    const brand: BrandContext = {
      niche: body.niche || "",
      brandName: body.brand?.brand_name || "",
      primaryColor: body.brand?.primary_color
        ? `rgb(${body.brand.primary_color.join(",")})`
        : "#DD2A7B",
      secondaryColor: body.brand?.secondary_color
        ? `rgb(${body.brand.secondary_color.join(",")})`
        : "#F58529",
      accentColor: body.brand?.accent_color
        ? `rgb(${body.brand.accent_color.join(",")})`
        : "#8134AF",
      toneFormality: body.tone_formality ?? 50,
      toneHumor: body.tone_humor ?? 50,
      voiceDescription: body.brand_voice || "",
      sampleCaptions: Array.isArray(body.sample_captions) ? body.sample_captions.filter((c: string) => c.trim()) : body.sample_caption ? [body.sample_caption] : [],
      contentPillars: body.content_pillars || [],
      brandHashtag: body.brand_hashtag || "",
    };

    // Strategy context (optional — passed from frontend if strategy exists)
    const strategy: StrategyContext | null = body.strategy || null;

    const slideCount = Math.min(10, Math.max(2, Number(body.slide_count) || 5));

    // Fetch products and upcoming moments for AI context
    let products: ProductContext[] = [];
    let moments: MomentContext[] = [];
    try {
      const userBrand = await prisma.brand.findFirst({ where: { userId: session.user.id } });
      if (userBrand) {
        const [dbProducts, dbMoments] = await Promise.all([
          prisma.product.findMany({ where: { brandId: userBrand.id, isActive: true }, take: 5 }),
          prisma.brandMoment.findMany({
            where: { brandId: userBrand.id, date: { gte: new Date() } },
            orderBy: { date: "asc" },
            take: 5,
          }),
        ]);
        products = dbProducts.map(p => ({
          name: p.name,
          description: p.description,
          category: p.category,
          usps: Array.isArray(p.usps) ? p.usps as string[] : [],
        }));
        moments = dbMoments.map(m => ({
          title: m.title,
          date: m.date.toISOString().slice(0, 10),
          type: m.type,
          description: m.description,
        }));
      }
    } catch {
      // Non-fatal: generate without product/moment context
    }

    const result = await generateCaption({
      topic: body.topic || "Instagram post",
      pillar: body.pillar || "facts",
      contentType: body.content_type || "image",
      style: body.image_style || "fact_card",
      brand,
      strategy,
      slideCount,
      products: products.length > 0 ? products : undefined,
      moments: moments.length > 0 ? moments : undefined,
    });

    // Generate image via backend (if running)
    let image_url: string | null = null;
    const contentType = body.content_type || "image";
    if (contentType !== "reel") {
      const slides = result.slides || (result.caption || "").split("\n").filter((l: string) => l.trim()).slice(0, slideCount).map((line: string) => ({
            headline: line.replace(/^\d+\.\s*/, "").slice(0, 60),
            body: "",
          }));
      const template = contentType === "carousel"
        ? buildCarouselTemplate({
            title: result.headline,
            slides,
          })
        : buildFactCardTemplate({
            headline: result.headline,
            body: result.caption.slice(0, 200),
            category: (body.pillar || "facts").toUpperCase(),
          });
      const backendBrand = buildBackendBrand({
        primaryColor: body.brand?.primary_color
          ? `#${body.brand.primary_color.map((c: number) => c.toString(16).padStart(2, "0")).join("")}`
          : "#8b5cf6",
        secondaryColor: body.brand?.secondary_color
          ? `#${body.brand.secondary_color.map((c: number) => c.toString(16).padStart(2, "0")).join("")}`
          : "#ec4899",
        accentColor: body.brand?.accent_color
          ? `#${body.brand.accent_color.map((c: number) => c.toString(16).padStart(2, "0")).join("")}`
          : "#f59e0b",
        brandName: body.brand?.brand_name || "",
      });
      const imgResult = await generateImage(template, backendBrand);
      if (imgResult?.path) {
        const path = Array.isArray(imgResult.path) ? imgResult.path[0] : imgResult.path;
        image_url = mediaUrl(path);
      }
    }

    return NextResponse.json({
      status: "generated",
      image_url,
      headline: result.headline,
      caption: result.caption,
      hashtags: result.hashtags,
      slides: contentType === "carousel" ? (result.slides || []) : undefined,
      quality_score: result.quality_score,
      quality_criteria: result.quality_criteria,
      content_type: contentType,
      generation_tier: body.generation_tier || "standard",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("Studio generate error:", message);

    // If API key is missing, return helpful error
    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        {
          error:
            "Set OPENAI_API_KEY in frontend/.env to enable AI content generation.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
