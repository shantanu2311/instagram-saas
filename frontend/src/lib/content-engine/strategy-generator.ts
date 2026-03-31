import { callAI, type GenerateStrategyRequest } from "./index";

export async function generateStrategy(req: GenerateStrategyRequest) {
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
  },
  "hookFormulas": [
    {
      "template": "Actually, {common belief} is wrong. Here's why...",
      "example": "Actually, posting every day doesn't grow your account. Here's why...",
      "type": "Pattern Interrupt"
    }
  ],
  "reelStructures": [
    {
      "name": "15s Pattern Interrupt",
      "duration": "15s",
      "sections": [
        { "label": "Hook", "duration": "0:00-0:03", "instruction": "Bold claim or question" },
        { "label": "Proof", "duration": "0:03-0:12", "instruction": "Quick evidence or demo" },
        { "label": "CTA", "duration": "0:12-0:15", "instruction": "Follow for more" }
      ],
      "faceless": false
    }
  ]
}

IMPORTANT:
- Content pillars must add up to 100%
- Include 3-5 pillars
- Schedule days must map to pillar names
- All examples must be specific to THIS business, not generic
- Growth tactics should be actionable within the first week
- Milestones should be realistic for the niche
- Generate 8-10 hook formulas specific to the user's niche. Cover these types: "Pattern Interrupt", "Controversial Take", "Surprising Stat", "Actually...", "Question Hook", "Story Hook". Each hook must have a template (with {placeholder} variables) and a filled-in example.
- Generate 3-4 reel structures: a 15s (pattern interrupt), 30s (quick tip), 60s (teaching reel), and optionally a faceless structure. Each structure has timed sections with labels, durations, and instructions. Set "faceless" to true only for structures that work without showing face.
- If products/services are provided, ensure content pillars and examples support showcasing them naturally (not salesy — value-first)
- If brand moments (launches, events, milestones) are provided, factor them into growth tactics and milestone planning
- If saved content ideas are provided, incorporate the best-fitting ones into pillar examples and growth tactics
- If Instagram page analysis is provided, use the REAL engagement data, content mix, top-performing posts, and best posting times to inform your recommendations. Build on what's already working — don't ignore proven successes. Adjust content format ratios based on actual performance data.`;

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
POSTING HISTORY: ${req.postingHistory || "New to Instagram"}${
    req.instagramPageAnalysis
      ? `\n\nINSTAGRAM PAGE ANALYSIS (real data from their current IG page):
@${req.instagramPageAnalysis.handle} — ${req.instagramPageAnalysis.followers.toLocaleString()} followers, ${req.instagramPageAnalysis.totalPosts} total posts
- Engagement rate: ${req.instagramPageAnalysis.engagementRate}% (avg ${req.instagramPageAnalysis.avgLikes} likes, ${req.instagramPageAnalysis.avgComments} comments per post)
- Posting frequency: ${req.instagramPageAnalysis.postingFrequency}
- Content mix: ${req.instagramPageAnalysis.contentMix.reels}% reels, ${req.instagramPageAnalysis.contentMix.carousels}% carousels, ${req.instagramPageAnalysis.contentMix.images}% images
- Best posting times: ${req.instagramPageAnalysis.bestPostingTimes.join(", ") || "N/A"}
${req.instagramPageAnalysis.topPosts.length > 0 ? `- Top performing posts:\n${req.instagramPageAnalysis.topPosts.map((p, i) => `  ${i + 1}. [${p.type}] ${p.likes} likes, ${p.comments} comments — "${p.caption.slice(0, 100)}${p.caption.length > 100 ? "..." : ""}"`).join("\n")}` : ""}
USE THIS REAL DATA to calibrate your recommendations — build on what works, fix what doesn't.`
      : ""
  }${
    req.products?.length
      ? `\n\nPRODUCTS/SERVICES (${req.products.length}):\n${req.products.map(p => `- ${p.name}: ${p.description}${p.category ? ` [${p.category}]` : ""}${p.price ? ` ($${p.price})` : ""}`).join("\n")}`
      : ""
  }${
    req.moments?.length
      ? `\n\nUPCOMING BRAND MOMENTS (${req.moments.length}):\n${req.moments.map(m => `- ${m.title} (${m.type})${m.date ? ` — ${m.date}` : ""}: ${m.description}`).join("\n")}`
      : ""
  }${
    req.ideas?.length
      ? `\n\nSAVED CONTENT IDEAS (${req.ideas.length}):\n${req.ideas.map(i => `- ${i.title}${i.contentType ? ` [${i.contentType}]` : ""}${i.pillar ? ` (${i.pillar})` : ""}${i.notes ? `: ${i.notes}` : ""}`).join("\n")}`
      : ""
  }${
    req.collateralContext
      ? `\n\nBUSINESS MATERIALS (uploaded documents with extracted info):\n${req.collateralContext}`
      : ""
  }${
    req.researchResults
      ? `\n\nRESEARCH FINDINGS (use these to inform your strategy):
${req.researchResults.competitors && req.researchResults.competitors.length > 0
  ? `COMPETITOR ANALYSIS:\n${req.researchResults.competitors.map(c =>
      `- @${c.handle}${c.name ? ` (${c.name})` : ""}: ${(c.followers/1000).toFixed(0)}K followers, ${c.engagementRate}% engagement, ${c.postingFrequency}. Strengths: ${c.strengths.join(", ")}. Weaknesses: ${c.weaknesses.join(", ")}`
    ).join("\n")}`
  : ""}
${req.researchResults.trends
  ? `TRENDING IN NICHE:\n- Hashtags: ${req.researchResults.trends.hashtags.join(", ")}\n- Viral content: ${req.researchResults.trends.viralExamples.map(v => `${v.type}: "${v.topic}" (${v.views} views)`).join("; ")}\n- Trending formats: ${req.researchResults.trends.trendingFormats.map(f => `${f.name} (${f.growth})`).join(", ")}`
  : ""}
${req.researchResults.insights && req.researchResults.insights.length > 0
  ? `KEY INSIGHTS:\n${req.researchResults.insights.map(i => `- ${i.text} (${i.confidence}% confidence)`).join("\n")}`
  : ""}`
      : ""
  }${
    req.deepDiveAnswers && req.deepDiveAnswers.length > 0
      ? `\n\nADDITIONAL CONTEXT FROM FOLLOW-UP QUESTIONS:\n${req.deepDiveAnswers
          .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
          .join("\n\n")}`
      : ""
  }`;

  const text = await callAI({
    system: systemPrompt,
    userMessage,
    model: "deep",
    maxTokens: 4096,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse strategy response from AI");
  }

  const strategy = JSON.parse(jsonMatch[0]);

  return {
    id: `strategy-${Date.now()}`,
    status: "draft",
    ...strategy,
  };
}
