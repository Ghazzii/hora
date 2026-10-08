import { createHash } from "node:crypto";
import { db } from "@/lib/db";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export async function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  if (process.env.NODE_ENV === "production") {
    const hashedKey = createHash("sha256").update(key).digest("hex");
    const rows = await db.$queryRaw<{ count: number; retryAfterSeconds: number }[]>`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
      VALUES (${hashedKey}, 1, clock_timestamp() + ${windowMs} * interval '1 millisecond')
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimitBucket"."resetAt" <= clock_timestamp() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" <= clock_timestamp() THEN clock_timestamp() + ${windowMs} * interval '1 millisecond' ELSE "RateLimitBucket"."resetAt" END
      RETURNING "count", GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("resetAt" - clock_timestamp()))))::integer AS "retryAfterSeconds"
    `;
    const bucket = rows[0]!;
    return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), retryAfterSeconds: bucket.retryAfterSeconds };
  }
  const now = Date.now();
  if (buckets.size > 10_000) for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }
  bucket.count += 1;
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
  };
}
