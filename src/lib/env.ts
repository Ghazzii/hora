import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  NEXT_PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
  META_PIXEL_ID: z.string().optional(),
  META_ACCESS_TOKEN: z.string().optional(),
  META_CATALOG_FEED_TOKEN: z.string().optional(),
});

export function serverEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ")}`,
    );
  }
  return parsed.data;
}

export const publicEnv = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID,
};
