import { NextResponse } from "next/server";
import {
  generateCaption,
  type BrandContext,
  type StrategyContext,
} from "@/lib/content-engine";
import {
  generateImage,
  buildBackendBrand,
  buildFactCardTemplate,
  mediaUrl,
} from "@/lib/backend-client";
import { auth } from "@/lib/auth";

interface CalendarSlot {
  date: string;
  day: number;
  dayOfWeek: string;
  pillar: string;
  contentType: "image" | "carousel" | "reel";
  topic: string;
  headline: string;
  suggestedTime: string;
  isTrendBased: boolean;
}

interface BatchRequest {
  slots: CalendarSlot[];
  brand: BrandContext;
  strategy: StrategyContext | null;
}

/**
 * Batch-generate content for multiple calendar slots.
 * Returns a stream of results as each slot completes (via NDJSON).
 * This allows the frontend to update the queue progressively.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: BatchRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body is required." },
        { status: 400 }
      );
    }

    const { slots, brand, strategy } = body;

    if (!slots || slots.length === 0) {
      return NextResponse.json({ error: "No slots provided" }, { status: 400 });
    }

    // Use ReadableStream for progressive results
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < slots.length; i++) {
          const slot = slots[i];
          try {
            const result = await generateCaption({
              topic: slot.topic,
              pillar: slot.pillar,
              contentType: slot.contentType,
              style: slot.contentType === "carousel" ? "listicle" : "fact_card",
              brand,
              strategy: strategy || undefined,
            });

            // Try to generate image via backend
            let image_url: string | null = null;
            if (slot.contentType !== "reel") {
              const template = buildFactCardTemplate({
                headline: result.headline,
                body: result.caption.slice(0, 200),
                category: slot.pillar.toUpperCase(),
              });
              const backendBrand = buildBackendBrand({
                primaryColor: brand.primaryColor,
                secondaryColor: brand.secondaryColor,
                accentColor: brand.accentColor,
                brandName: brand.brandName,
              });
              const imgResult = await generateImage(template, backendBrand);
              if (imgResult?.path) {
                const path = Array.isArray(imgResult.path) ? imgResult.path[0] : imgResult.path;
                image_url = mediaUrl(path);
              }
            }

            const item = {
              index: i,
              slotDate: slot.date,
              status: "success" as const,
              image_url,
              headline: result.headline,
              caption: result.caption,
              hashtags: result.hashtags,
              qualityScore: result.quality_score,
              pillar: slot.pillar,
              contentType: slot.contentType,
              topic: slot.topic,
              suggestedTime: slot.suggestedTime,
            };

            controller.enqueue(encoder.encode(JSON.stringify(item) + "\n"));
          } catch (err) {
            const item = {
              index: i,
              slotDate: slot.date,
              status: "failed" as const,
              error: err instanceof Error ? err.message : "Generation failed",
              pillar: slot.pillar,
              contentType: slot.contentType,
              topic: slot.topic,
              suggestedTime: slot.suggestedTime,
            };
            controller.enqueue(encoder.encode(JSON.stringify(item) + "\n"));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Batch generation failed";
    console.error("Batch generate error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
