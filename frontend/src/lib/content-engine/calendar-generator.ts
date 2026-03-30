import {
  callAI,
  type GenerateCalendarRequest,
} from "./index";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDayOfWeek(d: Date): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

export async function generateCalendar(req: GenerateCalendarRequest) {
  const start = new Date(req.startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + req.days - 1);

  const startStr = formatDate(start);
  const endStr = formatDate(end);

  const pillarNames =
    req.strategy.contentPillars?.map((p) => p.name) || ["Education", "Entertainment", "Engagement"];
  const hashtagsContext = req.strategy.hashtagStrategy
    ? `Branded: ${req.strategy.hashtagStrategy.branded.join(" ")} | Niche: ${req.strategy.hashtagStrategy.niche.join(" ")}`
    : "";

  const systemPrompt = `You are an Instagram content calendar planner. Generate content slots for a specific date range that follow the brand's strategy.

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
8. ALL dates must fall within the specified range — do NOT generate slots before the start date
9. If brand moments are provided with dates, schedule related content 1-2 days before each moment to build anticipation
10. If content ideas are provided, use them as topics for calendar slots where they naturally fit the pillar/type mix

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

  let userMessage = `Generate a content calendar for ${req.brand.brandName || "this brand"} for ${req.days} days from ${startStr} to ${endStr}. Schedule ${req.postsPerWeek} posts per week. Start from ${startStr} (${getDayOfWeek(start)}) — do not include any dates before this.`;

  if (req.moments?.length) {
    userMessage += `\n\nBRAND MOMENTS IN THIS PERIOD — schedule content around these dates:\n${req.moments.map(m => `- ${m.date || "TBD"}: ${m.title} (${m.type}) — ${m.description}`).join("\n")}`;
  }

  if (req.ideas?.length) {
    userMessage += `\n\nCONTENT IDEAS TO INCORPORATE — use these as calendar slot topics where they fit:\n${req.ideas.map(i => `- ${i.title}${i.contentType ? ` [${i.contentType}]` : ""}${i.pillar ? ` (${i.pillar})` : ""}`).join("\n")}`;
  }

  const text = await callAI({
    system: systemPrompt,
    userMessage,
    model: "fast",
    maxTokens: 4096,
  });

  // Extract JSON array
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse calendar response from AI");
  }

  const slots = JSON.parse(jsonMatch[0]);

  // Filter out any slots before startDate (AI sometimes ignores instructions)
  const filteredSlots = slots.filter(
    (s: { date: string }) => s.date >= startStr
  );

  return {
    id: `calendar-${Date.now()}`,
    startDate: startStr,
    endDate: endStr,
    slots: filteredSlots,
  };
}
