import { callClaude, type BrandContext, type StrategyContext } from "./index";

export interface RepurposeRequest {
  sourceContent: string;
  sourceType: "blog" | "transcript" | "notes" | "other";
  brand: BrandContext;
  strategy?: StrategyContext | null;
}

export interface RepurposedOutput {
  reel: {
    hook: string;
    script: string;
    onScreenText: string[];
    duration: string;
  };
  carousel: {
    title: string;
    slides: string[];
  };
  caption: {
    headline: string;
    caption: string;
    hashtags: string[];
  };
  stories: Array<{
    text: string;
    cta: string;
  }>;
}

function buildToneDescription(formality: number, humor: number): string {
  const formalLabel =
    formality < 30 ? "very casual" : formality < 60 ? "conversational" : "professional";
  const humorLabel =
    humor < 30 ? "serious and authoritative" : humor < 60 ? "warm and approachable" : "playful and witty";
  return `${formalLabel}, ${humorLabel}`;
}

function buildSystemPrompt(req: RepurposeRequest): string {
  const tone = buildToneDescription(req.brand.toneFormality, req.brand.toneHumor);

  let prompt = `You are a top-tier Instagram content strategist who specialises in repurposing long-form content into multiple high-performing Instagram formats. You extract the most engaging ideas and reformat them for maximum scroll-stopping impact.

BRAND CONTEXT:
- Brand: ${req.brand.brandName || "a growing brand"}
- Niche: ${req.brand.niche || "general"}
- Tone: ${tone}
${req.brand.voiceDescription ? `- Voice: ${req.brand.voiceDescription}` : ""}
${req.brand.sampleCaptions?.length ? `\nFEW-SHOT VOICE EXAMPLES (match this style closely):\n${req.brand.sampleCaptions.map((c, i) => `${i + 1}. "${c}"`).join("\n")}` : ""}
- Content pillars: ${req.brand.contentPillars.length > 0 ? req.brand.contentPillars.join(", ") : "education, entertainment, engagement"}
${req.brand.brandHashtag ? `- Brand hashtag: ${req.brand.brandHashtag}` : ""}`;

  if (req.strategy?.toneAndVoice) {
    prompt += `\n\nAPPROVED STRATEGY:`;
    if (req.strategy.brandPositioning) {
      prompt += `\n- Positioning: ${req.strategy.brandPositioning.summary}`;
    }
    prompt += `\n- DO: ${req.strategy.toneAndVoice.doList.join("; ")}`;
    prompt += `\n- DON'T: ${req.strategy.toneAndVoice.dontList.join("; ")}`;
  }

  prompt += `

RULES:
1. Extract the most engaging 3-5 key ideas from the source content
2. Each output format must work independently — don't assume the reader has seen the source
3. Match the brand's tone exactly — ${tone}
4. Hooks must grab attention in the first line
5. Reel script must have precise timing (30-60 seconds total)
6. Carousel slides should be 1 key point per slide, max 7 slides
7. Caption should be 150-400 characters with a clear CTA
8. Story slides should include engagement prompts (polls, questions, sliders)
${req.brand.sampleCaptions?.length ? `9. Mirror the voice examples above — same sentence structure, vocabulary, emoji style` : ""}

Return ONLY valid JSON with this exact structure:
{
  "reel": {
    "hook": "Opening hook (first 3 seconds)",
    "script": "Full script with [TIMESTAMP] markers e.g. [0:00-0:03] Hook...",
    "onScreenText": ["Text overlay 1", "Text overlay 2", "..."],
    "duration": "30s" or "60s"
  },
  "carousel": {
    "title": "Carousel cover slide headline",
    "slides": ["Slide 1 text", "Slide 2 text", "... up to 7 slides"]
  },
  "caption": {
    "headline": "Short catchy headline for image overlay",
    "caption": "Full standalone caption with \\n line breaks",
    "hashtags": ["#tag1", "#tag2", "... 8-12 tags"]
  },
  "stories": [
    { "text": "Story slide 1 text", "cta": "Poll: Yes/No" },
    { "text": "Story slide 2 text", "cta": "Question sticker prompt" },
    { "text": "Story slide 3 text", "cta": "Swipe up / Link" }
  ]
}`;

  return prompt;
}

export async function repurposeContent(
  req: RepurposeRequest
): Promise<RepurposedOutput> {
  const sourceLabel =
    req.sourceType === "blog" ? "blog post" :
    req.sourceType === "transcript" ? "video/podcast transcript" :
    req.sourceType === "notes" ? "notes/bullet points" : "content";

  const text = await callClaude({
    system: buildSystemPrompt(req),
    userMessage: `Repurpose this ${sourceLabel} into 4 Instagram formats (Reel script, Carousel, Caption post, Stories):\n\n---\n${req.sourceContent}\n---`,
    model: "fast",
    maxTokens: 2048,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse repurpose response from Claude");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("Claude returned invalid JSON for repurpose");
  }

  const reel = (parsed.reel as Record<string, unknown>) || {};
  const carousel = (parsed.carousel as Record<string, unknown>) || {};
  const caption = (parsed.caption as Record<string, unknown>) || {};

  return {
    reel: {
      hook: (reel.hook as string) || "",
      script: (reel.script as string) || "",
      onScreenText: Array.isArray(reel.onScreenText) ? reel.onScreenText : [],
      duration: (reel.duration as string) || "30s",
    },
    carousel: {
      title: (carousel.title as string) || "",
      slides: Array.isArray(carousel.slides) ? carousel.slides : [],
    },
    caption: {
      headline: (caption.headline as string) || "",
      caption: (caption.caption as string) || "",
      hashtags: Array.isArray(caption.hashtags) ? caption.hashtags : [],
    },
    stories: Array.isArray(parsed.stories) ? parsed.stories : [],
  };
}
