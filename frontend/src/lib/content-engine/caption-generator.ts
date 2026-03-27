import {
  callClaude,
  type GenerateContentRequest,
  type GenerateContentResult,
} from "./index";

function buildToneDescription(formality: number, humor: number): string {
  const formalLabel =
    formality < 30 ? "very casual" : formality < 60 ? "conversational" : "professional";
  const humorLabel =
    humor < 30 ? "serious and authoritative" : humor < 60 ? "warm and approachable" : "playful and witty";
  return `${formalLabel}, ${humorLabel}`;
}

function buildSystemPrompt(req: GenerateContentRequest): string {
  const tone = buildToneDescription(req.brand.toneFormality, req.brand.toneHumor);
  const hasStrategy = req.strategy && req.strategy.toneAndVoice;

  let prompt = `You are a top-tier Instagram content strategist and copywriter. You create content that stops the scroll, drives engagement, and builds brand authority.

BRAND CONTEXT:
- Brand: ${req.brand.brandName || "a growing brand"}
- Niche: ${req.brand.niche || "general"}
- Tone: ${tone}
${req.brand.voiceDescription ? `- Voice: ${req.brand.voiceDescription}` : ""}
${req.brand.sampleCaption ? `- Example of their voice: "${req.brand.sampleCaption}"` : ""}
- Content pillars: ${req.brand.contentPillars.length > 0 ? req.brand.contentPillars.join(", ") : "education, entertainment, engagement"}
${req.brand.brandHashtag ? `- Brand hashtag: ${req.brand.brandHashtag}` : ""}`;

  if (hasStrategy) {
    const s = req.strategy!;
    prompt += `\n\nAPPROVED STRATEGY:`;
    if (s.brandPositioning) {
      prompt += `\n- Positioning: ${s.brandPositioning.summary}`;
    }
    if (s.toneAndVoice) {
      prompt += `\n- DO: ${s.toneAndVoice.doList.join("; ")}`;
      prompt += `\n- DON'T: ${s.toneAndVoice.dontList.join("; ")}`;
    }
    if (s.hashtagStrategy) {
      prompt += `\n- Branded hashtags: ${s.hashtagStrategy.branded.join(" ")}`;
      prompt += `\n- Niche hashtags: ${s.hashtagStrategy.niche.join(" ")}`;
    }
  }

  prompt += `\n\nCONTENT TYPE: ${req.contentType}
STYLE: ${req.style}
PILLAR: ${req.pillar}

RULES:
1. Hook must grab attention in the first line (question, bold claim, or pattern interrupt)
2. Use line breaks for readability — no walls of text
3. Include a clear CTA (save, share, comment, or follow)
4. Caption length: 150-400 characters for images, 200-600 for carousels, 100-250 for reels
5. Generate 8-12 relevant hashtags mixing branded, niche, and reach tags
6. Headline must be punchy (max 10 words) for the image overlay
7. Match the brand's tone exactly — ${tone}

Return ONLY valid JSON with this exact structure:
{
  "headline": "short catchy headline for image overlay",
  "caption": "full caption with \\n line breaks",
  "hashtags": ["#tag1", "#tag2", ...],
  "quality_scores": {
    "hook_strength": <1-10>,
    "caption_quality": <1-10>,
    "hashtag_relevance": <1-10>,
    "cta_strength": <1-10>,
    "brand_alignment": <1-10>
  }
}`;

  return prompt;
}

export async function generateCaption(
  req: GenerateContentRequest
): Promise<GenerateContentResult> {
  const text = await callClaude({
    system: buildSystemPrompt(req),
    userMessage: `Create an Instagram ${req.contentType} post about: ${req.topic}`,
    model: "fast",
    maxTokens: 1024,
  });

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse caption response from Claude");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const scores = parsed.quality_scores || {};

  const hookStrength = scores.hook_strength || 8;
  const captionQuality = scores.caption_quality || 8;
  const hashtagRelevance = scores.hashtag_relevance || 8;
  const ctaStrength = scores.cta_strength || 7;
  const brandAlignment = scores.brand_alignment || 8;

  const avgScore = Math.round(
    ((hookStrength + captionQuality + hashtagRelevance + ctaStrength + brandAlignment) / 5) * 10
  );

  return {
    headline: parsed.headline || req.topic.slice(0, 60),
    caption: parsed.caption || "",
    hashtags: parsed.hashtags || ["#content", "#instagram"],
    quality_score: Math.min(avgScore, 100),
    quality_criteria: {
      hook_strength: hookStrength,
      caption_quality: captionQuality,
      hashtag_relevance: hashtagRelevance,
      cta_strength: ctaStrength,
      brand_alignment: brandAlignment,
    },
  };
}
