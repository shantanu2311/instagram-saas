import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/strategy/trends`, {
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
        mock: true,
        trends: {
          hashtags: [
            "#growthmindset",
            "#entrepreneurlife",
            "#contentstrategy",
            "#reelstrending",
            "#businesstips",
          ],
          formats: [
            { name: "Talking head reels", growth: "+45%" },
            { name: "Carousel tips", growth: "+32%" },
            { name: "BTS content", growth: "+28%" },
          ],
          insights: [
            "Carousel posts are getting 3x more saves this month",
            "Behind-the-scenes content is trending in your niche",
            "Short-form video under 30s has highest completion rate",
          ],
        },
        refreshedAt: new Date().toISOString(),
      });
    }
    return NextResponse.json(
      { error: "Trends service unavailable. Please try again later." },
      { status: 503 }
    );
  }
}

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/strategy/trends`);
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        mock: true,
        trends: {
          hashtags: [
            "#growthmindset",
            "#entrepreneurlife",
            "#contentstrategy",
          ],
          formats: [
            { name: "Talking head reels", growth: "+45%" },
            { name: "Carousel tips", growth: "+32%" },
          ],
          insights: [
            "Carousel posts are getting 3x more saves this month",
          ],
        },
        refreshedAt: new Date().toISOString(),
      });
    }
    return NextResponse.json(
      { error: "Trends service unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
