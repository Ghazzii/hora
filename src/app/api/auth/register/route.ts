import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createSession, registerCustomer } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(`register:${key}`, 5, 60_000).allowed) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid account details", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  try {
    const user = await registerCustomer(parsed.data);
    await createSession(user.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    throw error;
  }
}
