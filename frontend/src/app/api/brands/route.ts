import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: Connect to Prisma DB
    // const brand = await prisma.brand.create({
    //   data: {
    //     userId: session.user.id,
    //     name: body.brandHashtag || "My Brand",
    //     niche: body.niche,
    //     primaryColor: body.primaryColor,
    //     secondaryColor: body.secondaryColor,
    //     accentColor: body.accentColor,
    //     ...
    //   },
    // });

    console.log("Brand created (stub):", body.niche, body.contentPillars);

    return NextResponse.json({
      id: "stub-brand-id",
      ...body,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // TODO: Return user's brands from Prisma
  return NextResponse.json([]);
}
