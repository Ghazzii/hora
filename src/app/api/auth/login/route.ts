import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(`login:${key}`, 8, 60_000).allowed) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({ ok: true, role: user.role });
}
