import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    // Verify the deployment's essential tables as well as the connection.
    // LIMIT 0 checks schema availability without reading customer records.
    await db.$queryRaw`SELECT 1 FROM "Order", "OrderSheetExport", "RateLimitBucket" LIMIT 0`;
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unavailable" }, { status: 503 });
  }
}
