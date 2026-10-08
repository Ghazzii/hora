import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { $queryRaw: mock.query } }));
import { checkRateLimit } from "./rate-limit";

describe("production PostgreSQL schema and shared rate limits", () => {
  const postgres = new PGlite();
  beforeAll(async () => {
    for (const migration of ["20260807000000_init", "20261008001000_production_integrations"]) {
      const sql = await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8");
      // PGlite has built-in gen_random_uuid but does not bundle pgcrypto.
      await postgres.exec(sql.replace('CREATE EXTENSION IF NOT EXISTS "pgcrypto";', ""));
    }
    mock.query.mockImplementation(async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = strings.reduce((query, part, index) => query + (index ? `$${index}` : "") + part, "");
      return (await postgres.query(sql, values)).rows;
    });
  }, 30_000);
  afterEach(() => vi.unstubAllEnvs());
  afterAll(async () => { await postgres.close(); });

  it("applies both migrations and enables RLS on every application table", async () => {
    const tables = await postgres.query<{ name: string; enabled: boolean }>(`SELECT relname AS name, relrowsecurity AS enabled FROM pg_class JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid WHERE nspname = 'public' AND relkind = 'r'`);
    expect(tables.rows.length).toBe(16);
    expect(tables.rows.every((table) => table.enabled)).toBe(true);
  });

  it("atomically caps parallel requests and resets expired buckets", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const requests = await Promise.all(Array.from({ length: 8 }, () => checkRateLimit("checkout:192.0.2.1", 5, 60_000)));
    expect(requests.filter((result) => result.allowed)).toHaveLength(5);
    expect(requests.at(-1)!.remaining).toBe(0);
    expect(requests.at(-1)!.retryAfterSeconds).toBeGreaterThan(0);
    const rows = await postgres.query<{ key: string; count: number }>('SELECT "key", "count" FROM "RateLimitBucket"');
    expect(rows.rows[0]!.key).not.toContain("192.0.2.1");
    expect(rows.rows[0]!.count).toBe(8);
    await postgres.exec(`UPDATE "RateLimitBucket" SET "resetAt" = CURRENT_TIMESTAMP - interval '1 second'`);
    expect(await checkRateLimit("checkout:192.0.2.1", 5, 60_000)).toMatchObject({ allowed: true, remaining: 4 });
  });

  it("enforces one export per order and rolls exports back with the transaction", async () => {
    await postgres.query(`INSERT INTO "OrderSheetExport" ("orderId", "values") VALUES ($1, $2)`, ["order-a", JSON.stringify(["Test customer"])]);
    await expect(postgres.query(`INSERT INTO "OrderSheetExport" ("orderId", "values") VALUES ($1, $2)`, ["order-a", "[]"])).rejects.toThrow();
    await expect(postgres.transaction(async (tx) => {
      await tx.query(`INSERT INTO "OrderSheetExport" ("orderId", "values") VALUES ($1, $2)`, ["rolled-back", "[]"]);
      throw new Error("Simulated order failure");
    })).rejects.toThrow("Simulated order failure");
    expect((await postgres.query(`SELECT * FROM "OrderSheetExport" WHERE "orderId" = 'rolled-back'`)).rows).toHaveLength(0);
  });
});
