import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { recordFirstPartyEvent } from "@/lib/analytics/server";
import { checkRateLimit } from "@/lib/rate-limit";
const schema = z.object({ name: z.enum(["ViewContent", "Search", "AddToCart", "InitiateCheckout", "OrderPlaced"]), payload: z.record(z.unknown()).default({}) });
export async function POST(request: Request) { const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"; if (!checkRateLimit(`analytics:${key}`, 60, 60_000).allowed) return new NextResponse(null, { status: 204 }); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 }); const user = await getCurrentUser(); await recordFirstPartyEvent(parsed.data.name, parsed.data.payload, { userId: user?.id }); return new NextResponse(null, { status: 204 }); }
