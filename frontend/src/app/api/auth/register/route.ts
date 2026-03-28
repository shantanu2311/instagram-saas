import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "auth");
  if (limited) return limited;
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body is required." },
      { status: 400 }
    );
  }

  const { name, email, password } = body;

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

  if (email.length > 254) {
    return Response.json(
      { error: "Email is too long" },
      { status: 400 }
    );
  }

  if (name.length > 100) {
    return Response.json(
      { error: "Name is too long" },
      { status: 400 }
    );
  }

  // Strip null bytes and control characters from name
  const sanitizedName = name.replace(/[\x00-\x1f]/g, "").trim();
  if (!sanitizedName) {
    return Response.json(
      { error: "Name contains invalid characters" },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return Response.json(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name: sanitizedName, email, passwordHash },
    });

    return Response.json(
      {
        message: "User created successfully",
        user: { id: user.id, name: user.name, email: user.email },
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
