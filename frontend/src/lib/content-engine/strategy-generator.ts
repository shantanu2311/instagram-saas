import { getClient, DEEP_MODEL, type GenerateStrategyRequest } from "./index";

export async function generateStrategy(req: GenerateStrategyRequest) {
  const client = getClient();

  const systemPrompt = `You are a world-class Instagram growth strategist who has helped hundreds of brands grow from 0 to 100K+ followers. You create data-informed, actionable content strategies tailored to each brand's unique position.

You analyze the business deeply and produce strategies that are specific, not generic. Every recommendation must be backed by a rationale tied to the brand's niche, audience, and competitive landscape.

Return ONLY valid JSON matching this exact structure:
{
  "brandPositioning": {
    "summary": "2-3 sentence positioning statement",
    "keyMessages": ["message1", "message2", "message3"]
  },
  "contentPillars": [
    {
      "name": "Pillar Name",
      "percentage": 40,
      "rationale": "Why this pillar works for this brand",
      "examples": ["Specific post idea 1", "Specific post idea 2", "Specific post idea 3"]
    }
  ],
  "postingCadence": {
    "postsPerWeek": 5,
    "bestTimes": ["7:30 AM", "12:00 PM", "6:30 PM"],
    "schedule": {
      "Mon": "Pillar Name",
      "Tue": "Pillar Name",
      "Wed": "Pillar Name",
      "Thu": "Pillar Name",
      "Fri": "Pillar Name"
    }
  },
  "toneAndVoice": {
    "doList": ["specific voice guideline 1", "..."],
    "dontList": ["specific thing to avoid 1", "..."],
    "sampleCaptions": ["Example caption matching the recommended voice", "..."]
  },
  "hashtagStrategy": {
    "branded": ["#BrandName", "#BrandTagline"],
    "niche": ["#relevant1", "#relevant2", "#relevant3", "#relevant4", "#relevant5"],
    "trending": ["#trend1", "#trend2", "#trend3"]
  },
  "contentFormats": { "reels": 50, "carousels": 30, "images": 20 },
  "growthTactics": [
    {
      "name": "Tactic Name",
      "impact": "High|Medium|Low",
      "description": "Specific actionable description"
    }
  ],
  "milestones": {
    "day30": { "followers": "+500", "engagement": "2%", "posts": 20 },
    "day60": { "followers": "+2,000", "engagement": "3%", "posts": 40 },
    "day90": { "followers": "+5,000", "engagement": "4%", "posts": 60 }
  }
}

IMPORTANT:
- Content pillars must add up to 100%
- Include 3-5 pillars
- Schedule days must map to pillar names
- All examples must be specific to THIS business, not generic
- Growth tactics should be actionable within the first week
- Milestones should be realistic for the niche`;

  const accountLabel =
    req.accountType === "creator"
      ? "content creator"
      : req.accountType === "personal"
      ? "personal account"
      : "business";

  const userMessage = `Create a complete Instagram content strategy for this ${accountLabel}:

ACCOUNT TYPE: ${req.accountType}
NAME: ${req.businessName}
DESCRIPTION: ${req.businessDescription}
${req.accountType === "business" ? "PRODUCT/SERVICE" : req.accountType === "creator" ? "NICHE/EXPERTISE" : "INTERESTS"}: ${req.productService}
${req.instagramHandle ? `INSTAGRAM: ${req.instagramHandle}` : ""}
USP: ${req.usp}
KEY DIFFERENTIATORS: ${req.keyDifferentiators.join(", ")}

TARGET AUDIENCE:
- Age: ${req.targetAgeMin}-${req.targetAgeMax}
- Demographics: ${req.targetDemographics.join(", ")}
- Location: ${req.targetLocation}

COMPETITORS / INSPIRATIONS: ${req.competitors.length > 0 ? req.competitors.join(", ") : "Not specified"}
GOALS: ${req.goals.join(", ")}
${req.ambition ? `VISION (6-month ambition): ${req.ambition}` : ""}
${req.monetizationGoal ? `MONETIZATION: ${req.monetizationGoal}` : ""}
CONTENT PREFERENCES: ${req.contentPreferences.join(", ")}
PAIN POINTS: ${req.painPoints.join(", ")}
BRAND PERSONALITY: ${req.brandPersonality.join(", ")}
POSTING HISTORY: ${req.postingHistory || "New to Instagram"}`;

  const response = await client.messages.create({
    model: DEEP_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse strategy response from Claude");
  }

  const strategy = JSON.parse(jsonMatch[0]);

  return {
    id: `strategy-${Date.now()}`,
    status: "draft",
    ...strategy,
  };
}
