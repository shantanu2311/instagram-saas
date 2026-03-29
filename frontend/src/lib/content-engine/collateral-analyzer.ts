/**
 * AI-powered collateral analysis.
 * Takes extracted text and classifies it into products, moments, inspiration, etc.
 */

import { callClaude } from "./index";

export interface CollateralAnalysis {
  summary: string;
  products: Array<{
    name: string;
    description: string;
    category?: string;
    price?: number;
    currency?: string;
    usps: string[];
  }>;
  moments: Array<{
    title: string;
    description: string;
    date?: string;
    type: "launch" | "event" | "milestone" | "collaboration" | "seasonal";
  }>;
  inspiration: Array<{
    title: string;
    description: string;
    contentType?: "image" | "carousel" | "reel";
    pillar?: string;
  }>;
  brandContext: {
    additionalInfo: string;
    keyFacts: string[];
    toneIndicators: string[];
  };
}

/**
 * Analyze extracted text from a collateral file using AI.
 * Returns structured data that can auto-populate products, moments, and inspiration.
 */
export async function analyzeCollateral(
  extractedText: string,
  filename: string,
  fileType: string
): Promise<CollateralAnalysis> {
  const systemPrompt = `You are analyzing a business document uploaded by an Instagram content creator. Your job is to extract useful information that can help build their content strategy.

Analyze the document and return ONLY valid JSON matching this structure:
{
  "summary": "1-2 sentence summary of what this document contains",
  "products": [
    {
      "name": "Product Name",
      "description": "What it is / does",
      "category": "optional category",
      "price": 29.99,
      "currency": "USD",
      "usps": ["unique selling point 1", "point 2"]
    }
  ],
  "moments": [
    {
      "title": "Event or Launch Name",
      "description": "What it is",
      "date": "2025-04-15",
      "type": "launch"
    }
  ],
  "inspiration": [
    {
      "title": "Content idea derived from this document",
      "description": "How to turn this into Instagram content",
      "contentType": "carousel",
      "pillar": "Education"
    }
  ],
  "brandContext": {
    "additionalInfo": "Any extra brand/business info found (mission, values, history, team, etc.)",
    "keyFacts": ["fact1", "fact2"],
    "toneIndicators": ["professional", "friendly"]
  }
}

RULES:
- Only extract what's actually in the document — don't make up products or events
- If the document is a pitch deck, focus on products, value props, and brand positioning
- If it's a spreadsheet, look for product catalogs, pricing, or event calendars
- If it's a text document, extract any brand info, product details, or content ideas
- For "moments", only include items with clear dates or time references
- For "inspiration", suggest 2-5 content ideas derived from the document's content
- Keep arrays empty if nothing relevant is found in that category
- Dates should be YYYY-MM-DD format
- Do NOT wrap in markdown code blocks`;

  const userMessage = `File: "${filename}" (${fileType})

DOCUMENT CONTENT:
${extractedText.slice(0, 30_000)}`;

  const text = await callClaude({
    system: systemPrompt,
    userMessage,
    model: "fast",
    maxTokens: 3000,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      summary: "Could not analyze this document.",
      products: [],
      moments: [],
      inspiration: [],
      brandContext: { additionalInfo: "", keyFacts: [], toneIndicators: [] },
    };
  }

  try {
    return JSON.parse(jsonMatch[0]) as CollateralAnalysis;
  } catch {
    return {
      summary: "Could not parse analysis results.",
      products: [],
      moments: [],
      inspiration: [],
      brandContext: { additionalInfo: "", keyFacts: [], toneIndicators: [] },
    };
  }
}
