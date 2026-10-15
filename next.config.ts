import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

// Remote product photo hosts: PRODUCT_IMAGE_HOST plus the Supabase Storage host used for uploads.
// Keep in sync with allowedImageHosts() in src/lib/storage.ts.
function imageHosts() {
  const hosts = (process.env.PRODUCT_IMAGE_HOST ?? "").split(",").map((host) => host.trim()).filter(Boolean);
  try {
    if (process.env.SUPABASE_URL) hosts.push(new URL(process.env.SUPABASE_URL).hostname);
  } catch { /* A malformed URL simply adds no host. */ }
  // Derive the Supabase project host from the database URL, as src/lib/storage.ts does.
  for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL]) {
    try {
      const url = new URL(value ?? "");
      const ref = /^postgres\.([a-z0-9]{20})$/.exec(decodeURIComponent(url.username))?.[1] ?? /^db\.([a-z0-9]{20})\.supabase\.co$/.exec(url.hostname)?.[1];
      if (ref) hosts.push(`${ref}.supabase.co`);
    } catch { /* Not a URL. */ }
  }
  return [...new Set(hosts)];
}

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: imageHosts().map((hostname) => ({ protocol: "https" as const, hostname, pathname: "/**" })),
  },
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
