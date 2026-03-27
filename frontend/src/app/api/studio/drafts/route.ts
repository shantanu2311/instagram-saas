import { NextResponse } from "next/server";

export async function GET() {
  // Stub — returns empty drafts until database is connected
  return NextResponse.json([]);
}
