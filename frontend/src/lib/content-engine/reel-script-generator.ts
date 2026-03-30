import { callAI, type BrandContext, type StrategyContext } from "./index";

export interface ReelScriptRequest {
  topic: string;
  pillar: string;
  brand: BrandContext;
  strategy?: StrategyContext | null;
  duration: "15" | "30" | "60" | "90";
  faceless: boolean;
}

export interface ReelScene {
  label: string;
  startSec: number;
  endSec: number;
  voiceover: string;
  onScreenText: string;
  visualDirection: string;
}

export interface ReelScriptResult {
  hook: string;
  scenes: ReelScene[];
  caption: string;
  hashtags: string[];
  audioSuggestion: string;
  totalDuration: number;
  quality_score: number;
  quality_criteria: {
    hook_strength: number;
    script_flow: number;
    cta_strength: number;
    brand_alignment: number;
    completion_bait: number;
  };
}

function buildToneDescription(formality: number, humor: number): string {
  const formalLabel =
    formality < 30 ? "very casual" : formality < 60 ? "conversational" : "professional";
  const humorLabel =
    humor < 30 ? "serious and authoritative" : humor < 60 ? "warm and approachable" : "playful and witty";
  return `${formalLabel}, ${humorLabel}`;
}

function getSceneStructure(duration: string): string {
  switch (duration) {
    case "15":
      return `3 scenes:
  - Hook (0-3s): Pattern-interrupt opener
  - Key Point (3-10s): Core value delivery
  - CTA (10-15s): Action prompt + twist`;
    case "30":
      return `4 scenes:
  - Hook (0-3s): Pattern-interrupt opener
  - Problem (3-10s): Relatable pain point
  - Solution (10-22s): Key insight or method
  - CTA (22-30s): Takeaway + call to action`;
    case "60":
      return `5 scenes:
  - Hook (0-3s): Pattern-interrupt opener
  - Problem (3-10s): Relatable struggle
  - Solution Step 1 (10-25s): First key insight
  - Solution Step 2 (25-45s): Second key insight or proof
  - CTA (45-60s): Results teaser + call to action`;
    case "90":
      return `6 scenes:
  - Hook (0-3s): Pattern-interrupt opener
  - Problem (3-12s): Deep relatable pain
  - Context (12-25s): Why common advice fails
  - Solution Step 1 (25-45s): Core method
  - Solution Step 2 (45-70s): Advanced tip or proof
  - CTA (70-90s): Transformation + call to action`;
    default:
      return getSceneStructure("30");
  }
}

function buildSystemPrompt(req: ReelScriptRequest): string {
  const tone = buildToneDescription(req.brand.toneFormality, req.brand.toneHumor);
  const hasStrategy = req.strategy && req.strategy.toneAndVoice;
  const structure = getSceneStructure(req.duration);

  let prompt = `You are an expert Instagram Reels scriptwriter who creates viral short-form video content. You specialize in high-retention scripts optimized for the 2026 algorithm.

BRAND CONTEXT:
- Brand: ${req.brand.brandName || "a growing brand"}
- Niche: ${req.brand.niche || "general"}
- Tone: ${tone}
${req.brand.voiceDescription ? `- Voice: ${req.brand.voiceDescription}` : ""}
${req.brand.sampleCaptions?.length ? `\nFEW-SHOT VOICE EXAMPLES (match this energy and style):\n${req.brand.sampleCaptions.map((c, i) => `${i + 1}. "${c}"`).join("\n")}` : ""}
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
  }

  prompt += `\n\nREEL PARAMETERS:
- Duration: ${req.duration} seconds
- Faceless: ${req.faceless ? "YES — no face on camera, use text overlays, b-roll, screen recordings, stock footage descriptions" : "NO — speaking to camera allowed"}
- Scene structure:
${structure}

RULES:
1. The hook MUST stop the scroll in under 3 seconds — use a bold claim, question, or pattern interrupt
2. Each scene must have voiceover text, on-screen text overlay, and a visual direction note
3. On-screen text should be SHORT (3-8 words per scene) — it appears as text overlay
4. Voiceover should be natural and conversational, matching the brand tone
5. Visual directions describe what the viewer sees (camera angles, b-roll, text animations)
${req.faceless ? "6. ALL visual directions must work without showing a face — text animations, stock footage, screen recordings, product shots, nature shots, etc." : "6. Mix talking-head with b-roll cuts to maintain visual interest"}
7. End with a strong CTA that encourages saves, shares, or follows
8. Include an audio/music suggestion that fits the mood
9. Caption should be optimized for saves (150-250 chars for Reels)

Return ONLY valid JSON:
{
  "hook": "the opening hook line (first 3 seconds)",
  "scenes": [
    {
      "label": "Hook|Problem|Solution|CTA|etc",
      "startSec": 0,
      "endSec": 3,
      "voiceover": "what is said/narrated",
      "onScreenText": "SHORT overlay text (3-8 words)",
      "visualDirection": "what the viewer sees"
    }
  ],
  "caption": "Instagram caption for the Reel post",
  "hashtags": ["#tag1", "#tag2", ...],
  "audioSuggestion": "music mood/genre or specific trending audio suggestion",
  "quality_scores": {
    "hook_strength": <1-10>,
    "script_flow": <1-10>,
    "cta_strength": <1-10>,
    "brand_alignment": <1-10>,
    "completion_bait": <1-10>
  }
}`;

  return prompt;
}

export async function generateReelScript(
  req: ReelScriptRequest
): Promise<ReelScriptResult> {
  const text = await callAI({
    system: buildSystemPrompt(req),
    userMessage: `Create an Instagram Reel script about: ${req.topic}`,
    model: "fast",
    maxTokens: 2048,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse reel script response from AI");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("AI returned invalid JSON for reel script");
  }

  const scores = (parsed.quality_scores as Record<string, number>) || {};

  const hookStrength = scores.hook_strength || 8;
  const scriptFlow = scores.script_flow || 8;
  const ctaStrength = scores.cta_strength || 7;
  const brandAlignment = scores.brand_alignment || 8;
  const completionBait = scores.completion_bait || 7;

  const avgScore = Math.round(
    ((hookStrength + scriptFlow + ctaStrength + brandAlignment + completionBait) / 5) * 10
  );

  const scenesRaw = Array.isArray(parsed.scenes) ? parsed.scenes : [];

  return {
    hook: (parsed.hook as string) || "",
    scenes: scenesRaw.map((s: ReelScene) => ({
      label: s.label || "Scene",
      startSec: s.startSec || 0,
      endSec: s.endSec || 0,
      voiceover: s.voiceover || "",
      onScreenText: s.onScreenText || "",
      visualDirection: s.visualDirection || "",
    })),
    caption: (parsed.caption as string) || "",
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ["#reels", "#instagram"],
    audioSuggestion: (parsed.audioSuggestion as string) || "Trending upbeat audio",
    totalDuration: parseInt(req.duration),
    quality_score: Math.min(avgScore, 100),
    quality_criteria: {
      hook_strength: hookStrength,
      script_flow: scriptFlow,
      cta_strength: ctaStrength,
      brand_alignment: brandAlignment,
      completion_bait: completionBait,
    },
  };
}
