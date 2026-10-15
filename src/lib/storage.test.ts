import { afterEach, describe, expect, it, vi } from "vitest";
import { allowedImageHosts, storageConfigured, supabaseProjectUrl, uploadProductImage } from "./storage";

const REF = "abcdefghijklmnopqrst";

describe("product photo storage", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("derives the Supabase project URL from pooled or direct database URLs", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("DATABASE_URL", `postgresql://postgres.${REF}:secret@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`);
    expect(supabaseProjectUrl()).toBe(`https://${REF}.supabase.co`);
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("DIRECT_URL", `postgresql://postgres:secret@db.${REF}.supabase.co:5432/postgres`);
    expect(supabaseProjectUrl()).toBe(`https://${REF}.supabase.co`);
    expect(allowedImageHosts()).toContain(`${REF}.supabase.co`);
  });

  it("stays off until the service key is set", () => {
    vi.stubEnv("DATABASE_URL", `postgresql://postgres.${REF}:secret@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(storageConfigured()).toBe(false);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_test");
    expect(storageConfigured()).toBe(true);
  });

  it("sends new secret keys only as apikey and returns the public URL", async () => {
    vi.stubEnv("SUPABASE_URL", `https://${REF}.supabase.co`);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_test");
    const fetch = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const url = await uploadProductImage(new ArrayBuffer(8), "image/webp");
    expect(url).toMatch(new RegExp(`^https://${REF}\\.supabase\\.co/storage/v1/object/public/product-images/products/\\d{4}/[0-9a-f-]{36}\\.webp$`));
    const headers = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headers.apikey).toBe("sb_secret_test");
    expect(headers.authorization).toBeUndefined();
  });

  it("creates the public bucket on first upload, then retries", async () => {
    vi.stubEnv("SUPABASE_URL", `https://${REF}.supabase.co`);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "eyJlegacy.jwt.key");
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Bucket not found" }), { status: 400 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    await uploadProductImage(new ArrayBuffer(8), "image/jpeg");
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringContaining("/storage/v1/object/product-images/"),
      `https://${REF}.supabase.co/storage/v1/bucket`,
      expect.stringContaining("/storage/v1/object/product-images/"),
    ]);
    expect((fetch.mock.calls[0]![1] as RequestInit).headers).toMatchObject({ authorization: "Bearer eyJlegacy.jwt.key" });
  });

  it("explains a rejected key", async () => {
    vi.stubEnv("SUPABASE_URL", `https://${REF}.supabase.co`);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_wrong");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 403 })));
    await expect(uploadProductImage(new ArrayBuffer(8), "image/png")).rejects.toThrow(/check SUPABASE_SERVICE_ROLE_KEY/);
  });
});
