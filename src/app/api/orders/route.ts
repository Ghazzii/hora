import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { checkoutSchema } from "@/lib/validation";
import { createOrder, OrderError } from "@/lib/orders";
import { parseAttributionCookie } from "@/lib/attribution";
import { ATTRIBUTION_COOKIE_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const headerStore = await headers();
  const client = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rate = checkRateLimit(`checkout:${client}`, 5, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many checkout attempts" }, { status: 429, headers: { "retry-after": String(rate.retryAfterSeconds) } });
  try {
    const body: unknown = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid checkout details", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
    const [cookieStore, user] = await Promise.all([cookies(), getCurrentUser()]);
    const attribution = parseAttributionCookie(cookieStore.get(ATTRIBUTION_COOKIE_NAME)?.value);
    const result = await createOrder(parsed.data, attribution, user?.id);
    return NextResponse.json(result, { status: result.reused ? 200 : 201 });
  } catch (error) {
    if (error instanceof OrderError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error("Order creation failed", error);
    return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
  }
}
