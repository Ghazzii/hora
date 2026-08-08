export type Attribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  campaignId?: string;
  adId?: string;
  adSetId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPage?: string;
};

const limits: Record<keyof Attribution, number> = {
  source: 80,
  medium: 80,
  campaign: 160,
  campaignId: 120,
  adId: 120,
  adSetId: 120,
  referrer: 500,
  utmSource: 80,
  utmMedium: 80,
  utmCampaign: 160,
  utmTerm: 160,
  utmContent: 200,
  landingPage: 500,
};

function safeString(value: unknown, limit: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().replace(/[\u0000-\u001F\u007F]/g, "");
  return normalized ? normalized.slice(0, limit) : undefined;
}

export function inferSource(value: Attribution): string {
  const explicit = value.source ?? value.utmSource;
  if (explicit) return explicit.toLowerCase();
  const referrer = value.referrer?.toLowerCase() ?? "";
  if (referrer.includes("facebook.com") || referrer.includes("fb.com")) return "facebook";
  if (referrer.includes("instagram.com")) return "instagram";
  if (referrer.includes("google.")) return "google";
  return "direct";
}

export function sanitizeAttribution(input: unknown): Attribution {
  if (!input || typeof input !== "object") return { source: "direct" };
  const record = input as Record<string, unknown>;
  const result: Attribution = {};
  for (const key of Object.keys(limits) as (keyof Attribution)[]) {
    const value = safeString(record[key], limits[key]);
    if (value) result[key] = value;
  }
  result.source = inferSource(result);
  return result;
}

export function parseAttributionCookie(raw?: string): Attribution {
  if (!raw) return { source: "direct" };
  try {
    return sanitizeAttribution(JSON.parse(decodeURIComponent(raw)));
  } catch {
    return { source: "direct" };
  }
}
