import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetch(`${BACKEND_URL}/strategy/research/${id}/status`);
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      mock: true,
      researchId: id,
      status: "complete",
      progress: 100,
      results: null,
    });
  }
}
