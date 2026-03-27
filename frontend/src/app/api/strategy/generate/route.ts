import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/strategy/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json(
        { error: `Backend error: ${error}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    if (process.env.NODE_ENV === "development") {
    return NextResponse.json({
      id: "mock-strategy-1",
      mock: true,
      status: "draft",
      brandPositioning: {
        summary:
          "A bold, innovative brand empowering professionals with actionable insights.",
        keyMessages: [
          "Empowering your growth",
          "Data-driven strategies",
          "Authentic connections",
        ],
      },
      contentPillars: [
        {
          name: "Education",
          percentage: 40,
          rationale: "Builds authority and drives saves",
          examples: ["Tips carousel", "How-to reel", "Myth-busting post"],
        },
        {
          name: "Entertainment",
          percentage: 30,
          rationale: "Drives shares and new followers",
          examples: ["Trending audio reel", "Meme post", "Relatable content"],
        },
        {
          name: "Promotion",
          percentage: 20,
          rationale: "Converts followers to customers",
          examples: [
            "Product showcase",
            "Customer testimonial",
            "Limited offer",
          ],
        },
        {
          name: "Community",
          percentage: 10,
          rationale: "Builds loyalty and engagement",
          examples: ["Q&A stories", "Poll", "User spotlight"],
        },
      ],
      postingCadence: {
        postsPerWeek: 5,
        bestTimes: ["7:30 AM", "12:00 PM", "6:30 PM"],
        schedule: {
          Mon: "Education",
          Tue: "Entertainment",
          Wed: "Education",
          Thu: "Promotion",
          Fri: "Entertainment",
        },
      },
      toneAndVoice: {
        doList: [
          "Be conversational and relatable",
          "Use data to back up claims",
          "Ask questions to drive engagement",
        ],
        dontList: [
          "Sound robotic or corporate",
          "Use jargon without explanation",
          "Be preachy or condescending",
        ],
        sampleCaptions: [
          "Stop scrolling. This one tip changed everything for me...",
          "Unpopular opinion: You don't need 10K followers to make money on IG.",
        ],
      },
      hashtagStrategy: {
        branded: ["#YourBrand", "#YourBrandTips"],
        niche: [
          "#contentstrategy",
          "#socialmediamarketing",
          "#instagramgrowth",
        ],
        trending: ["#reelstrending", "#viralcontent", "#growthmindset"],
      },
      contentFormats: { reels: 50, carousels: 30, images: 20 },
      growthTactics: [
        {
          name: "Collaboration Reels",
          impact: "High",
          description:
            "Partner with complementary accounts for shared reach",
        },
        {
          name: "Comment Strategy",
          impact: "Medium",
          description:
            "Leave valuable comments on larger accounts in your niche",
        },
        {
          name: "Story Engagement",
          impact: "Medium",
          description:
            "Use polls, quizzes, and questions in daily stories",
        },
      ],
      milestones: {
        day30: { followers: "+500", engagement: "2%", posts: 20 },
        day60: { followers: "+2,000", engagement: "3%", posts: 40 },
        day90: { followers: "+5,000", engagement: "4%", posts: 60 },
      },
    });
    }
    return NextResponse.json(
      { error: "Strategy generation service unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
