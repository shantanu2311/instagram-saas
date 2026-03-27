import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // TODO: Save to Prisma GeneratedContent table
    // For now, return a stub
    return NextResponse.json({
      id: `draft_${Date.now()}`,
      status: "saved",
      ...body,
    });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
