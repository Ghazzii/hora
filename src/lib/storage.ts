import { randomUUID } from "node:crypto";

export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * The Supabase project URL: SUPABASE_URL when set, otherwise derived from the
 * Supabase database connection string (user "postgres.<ref>" or host "db.<ref>.supabase.co").
 * Keep in sync with next.config.ts.
 */
export function supabaseProjectUrl() {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL.replace(/\/$/, "");
  for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL]) {
    try {
      const url = new URL(value ?? "");
      const ref = /^postgres\.([a-z0-9]{20})$/.exec(decodeURIComponent(url.username))?.[1] ?? /^db\.([a-z0-9]{20})\.supabase\.co$/.exec(url.hostname)?.[1];
      if (ref) return `https://${ref}.supabase.co`;
    } catch { /* Not a URL; try the next one. */ }
  }
  return null;
}

function config() {
  const url = supabaseProjectUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
  return url && key ? { url, key, bucket } : null;
}

/** Legacy service_role keys are JWTs sent as a bearer token; new sb_secret_ keys go in the apikey header only. */
function authHeaders(key: string): Record<string, string> {
  return key.startsWith("eyJ") ? { apikey: key, authorization: `Bearer ${key}` } : { apikey: key };
}

/** Remote hosts next/image may serve: PRODUCT_IMAGE_HOST plus the Supabase Storage host. Keep in sync with next.config.ts. */
export function allowedImageHosts() {
  const hosts = (process.env.PRODUCT_IMAGE_HOST ?? "").split(",").map((host) => host.trim()).filter(Boolean);
  try {
    const project = supabaseProjectUrl();
    if (project) hosts.push(new URL(project).hostname);
  } catch { /* Ignore a malformed URL; uploads will report it. */ }
  return [...new Set(hosts)];
}

/** Why a product photo URL can't be displayed, or null when it can: site paths and https links on an allowed host. */
export function imageUrlProblem(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return null;
  let host = "";
  try {
    const url = new URL(value);
    if (url.protocol === "https:") host = url.hostname;
  } catch { /* Reported below. */ }
  const allowed = allowedImageHosts();
  if (!host) return "Images must be https:// links or site paths like /images/…";
  if (!allowed.includes(host)) return `Images from ${host} can't be displayed. Upload the photo, or add that host to PRODUCT_IMAGE_HOST${allowed.length ? ` (allowed now: ${allowed.join(", ")})` : ""}.`;
  return null;
}

/** Product photos can be uploaded only when Supabase Storage credentials are configured. */
export function storageConfigured() {
  return config() !== null;
}

async function createPublicBucket(url: string, key: string, bucket: string) {
  const response = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...authHeaders(key), "content-type": "application/json" },
    body: JSON.stringify({ id: bucket, name: bucket, public: true, file_size_limit: MAX_IMAGE_BYTES, allowed_mime_types: Object.keys(ALLOWED_IMAGE_TYPES) }),
    signal: AbortSignal.timeout(10_000),
  });
  // 409/400 "already exists" is fine: another upload created it first.
  if (!response.ok && response.status !== 409 && response.status !== 400) throw new Error(`Storage bucket HTTP ${response.status}`);
}

/** Uploads a validated image to the public product bucket and returns its public URL. */
export async function uploadProductImage(bytes: ArrayBuffer, type: keyof typeof ALLOWED_IMAGE_TYPES) {
  const settings = config();
  if (!settings) throw new Error("Storage not configured");
  const { url, key, bucket } = settings;
  const path = `products/${new Date().getUTCFullYear()}/${randomUUID()}.${ALLOWED_IMAGE_TYPES[type]}`;
  const upload = () =>
    fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: { ...authHeaders(key), "content-type": type, "cache-control": "31536000", "x-upsert": "false" },
      body: bytes,
      signal: AbortSignal.timeout(20_000),
    });
  let response = await upload();
  if (!response.ok && (response.status === 404 || (response.status === 400 && /bucket not found/i.test(await response.clone().text())))) {
    await createPublicBucket(url, key, bucket);
    response = await upload();
  }
  if (response.status === 401 || response.status === 403) throw new Error("Storage rejected the key — check SUPABASE_SERVICE_ROLE_KEY.");
  if (!response.ok) throw new Error(`Storage upload HTTP ${response.status}`);
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}
