import {
  getClient,
  FAST_MODEL,
  type GenerateCalendarRequest,
} from "./index";

export async function generateCalendar(req: GenerateCalendarRequest) {
  const client = getClient();

  const daysInMonth = new Date(req.year, req.month, 0).getDate();
  const pillarNames =
    req.strategy.contentPillars?.map((p) => p.name) || ["Education", "Entertainment", "Engagement"];
  const hashtagsContext = req.strategy.hashtagStrategy
    ? `Branded: ${req.strategy.hashtagStrategy.branded.join(" ")} | Niche: ${req.strategy.hashtagStrategy.niche.join(" ")}`
    : "";

  const systemPrompt = `You are an Instagram content calendar planner. Generate a month of content slots that follow the brand's strategy.

STRATEGY CONTEXT:
- Pillars: ${pillarNames.join(", ")}
- Brand: ${req.brand.brandName || "Brand"} in ${req.brand.niche || "general"} niche
${hashtagsContext ? `- Hashtags: ${hashtagsContext}` : ""}
- Posts per week: ${req.postsPerWeek}

RULES:
1. Only schedule on weekdays (Mon-Fri) unless postsPerWeek > 5
2. Each slot needs a specific, actionable topic — NOT generic placeholders
3. Mix content types (reel, carousel, image) according to strategy format ratios
4. Distribute pillars according to their percentage weights
5. Mark ~20% of posts as trend-based opportunities
6. Suggested times should vary between morning (7-9 AM), lunch (11:30-1 PM), and evening (5-7 PM)
7. Headlines should be specific enough that a creator knows exactly what to make

Return ONLY a JSON array of slot objects:
[
  {
    "date": "YYYY-MM-DD",
    "day": 1,
    "dayOfWeek": "Mon",
    "pillar": "Pillar Name",
    "contentType": "reel|carousel|image",
    "topic": "Specific actionable topic description",
    "headline": "Draft headline for this post",
    "suggestedTime": "7:30 AM",
    "isTrendBased": false
  }
]`;

  const userMessage = `Generate a content calendar for ${req.brand.brandName || "this brand"} for ${req.month}/${req.year} (${daysInMonth} days). Schedule ${req.postsPerWeek} posts per week.`;

  const response = await client.messages.create({
    model: FAST_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON array
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse calendar response from Claude");
  }

  const slots = JSON.parse(jsonMatch[0]);

  return {
    id: `calendar-${Date.now()}`,
    month: req.month,
    year: req.year,
    slots,
  };
}
