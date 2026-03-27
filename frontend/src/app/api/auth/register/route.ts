import { NextRequest } from "next/server";

// TODO: Install bcryptjs — `npm install bcryptjs @types/bcryptjs`
// TODO: Connect to Prisma DB for real user creation

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return Response.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Stub: In production, hash password with bcryptjs and save to DB
    // const hashedPassword = await bcrypt.hash(password, 12);
    // const user = await prisma.user.create({
    //   data: { name, email, password: hashedPassword },
    // });

    return Response.json(
      {
        message: "User created successfully",
        user: { id: "stub-user-id", name, email },
      },
      { status: 201 }
    );
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
