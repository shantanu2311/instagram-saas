import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(
      `${BACKEND_URL}/strategy/${body.strategyId}/calendar/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

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
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Calendar service unavailable. Please try again later." },
        { status: 503 }
      );
    }
    // Mock calendar generation (development only)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const pillars = ["Education", "Entertainment", "Promotion", "Community"];
    const types = ["reel", "carousel", "image", "reel", "carousel"];
    const topics = [
      "5 tips for beginners",
      "Day in the life reel",
      "Product showcase carousel",
      "Community Q&A",
      "Trending audio reel",
      "Before/after transformation",
      "Industry myth busting",
      "Behind the scenes",
      "Customer spotlight",
      "Weekly roundup",
    ];
    const slots: any[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue;
      slots.push({
        date: date.toISOString().split("T")[0],
        day: d,
        dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow],
        pillar: pillars[d % pillars.length],
        contentType: types[d % types.length],
        topic: topics[d % topics.length],
        headline: `Draft headline for ${topics[d % topics.length]}`,
        suggestedTime: d % 2 === 0 ? "7:30 AM" : "6:30 PM",
        isTrendBased: d % 4 === 0,
      });
    }

    return NextResponse.json({
      id: "mock-calendar-1",
      mock: true,
      month: month + 1,
      year,
      slots,
    });
  }
}

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/strategy/calendar`);
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        mock: true,
        calendars: [],
      });
    }
    return NextResponse.json(
      { error: "Calendar service unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
