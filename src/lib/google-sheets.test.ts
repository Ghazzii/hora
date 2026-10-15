import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportPKCS8, generateKeyPair } from "jose";

const mock = vi.hoisted(() => ({ findMany: vi.fn(), updateMany: vi.fn(), upsert: vi.fn(), findOrder: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { orderSheetExport: { findMany: mock.findMany, updateMany: mock.updateMany, upsert: mock.upsert }, order: { findUnique: mock.findOrder } } }));

const VERSION = new Date("2026-10-09T10:00:00Z");

describe("order spreadsheet delivery", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("GOOGLE_SHEETS_SPREADSHEET_ID", "test-sheet");
    vi.stubEnv("GOOGLE_SHEETS_TAB_NAME", "Orders");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "orders@test.iam.gserviceaccount.com");
    const { privateKey } = await generateKeyPair("RS256", { extractable: true });
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", await exportPKCS8(privateKey));
    mock.findMany.mockResolvedValue([{ id: 3, orderId: "order-1", values: ["=IMPORTXML(secret)", "+21622555666", "0200"], attempts: 0, nextAttemptAt: VERSION }]);
    mock.updateMany.mockResolvedValue({ count: 1 });
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  function googleFetch(status = 200, rowCount = 1000) {
    return vi.fn(async (url: string, _init?: RequestInit) => {
      if (url.includes("oauth2")) return Response.json({ access_token: "test-token", expires_in: 3600 });
      if (url.includes("?fields=")) return Response.json({ sheets: [{ properties: { sheetId: 0, title: "Orders", gridProperties: { rowCount } } }] });
      return Response.json({}, { status });
    });
  }

  const writes = (fetch: ReturnType<typeof googleFetch>) =>
    fetch.mock.calls.filter(([url]) => url.includes("values:batchUpdate")).map(([, init]) => JSON.parse(String(init!.body)) as { valueInputOption: string; data: { range: string; values: unknown[][] }[] });

  it("writes RAW values and the header to the same stable row on repeated delivery", async () => {
    const fetch = googleFetch(); vi.stubGlobal("fetch", fetch);
    const { syncOrderSheets } = await import("./google-sheets");
    expect(await syncOrderSheets("order-1")).toEqual({ configured: true, synced: 1, failed: 0 });
    await syncOrderSheets("order-1");
    const [first, second] = writes(fetch);
    expect(first).toEqual(second);
    expect(first!.valueInputOption).toBe("RAW");
    expect(first!.data.map((entry) => entry.range)).toEqual(["'Orders'!A1:W1", "'Orders'!A4:W4"]);
    expect(first!.data[0]!.values[0]).toContain("Status");
    expect(first!.data[1]!.values[0]).toEqual(["=IMPORTXML(secret)", "+21622555666", "0200"]);
  });

  it("only marks a row synced if it was not refreshed while being written", async () => {
    vi.stubGlobal("fetch", googleFetch());
    const { syncOrderSheets } = await import("./google-sheets");
    await syncOrderSheets("order-1");
    expect(mock.updateMany).toHaveBeenCalledWith({
      where: { id: 3, nextAttemptAt: VERSION },
      data: { syncedAt: expect.any(Date), lastError: null, attempts: { increment: 1 } },
    });
  });

  it("keeps failed writes pending and schedules a retry without leaking response data", async () => {
    vi.stubGlobal("fetch", googleFetch(503)); vi.spyOn(console, "error").mockImplementation(() => {});
    const { syncOrderSheets } = await import("./google-sheets");
    expect(await syncOrderSheets()).toEqual({ configured: true, synced: 0, failed: 1 });
    expect(mock.updateMany).toHaveBeenCalledTimes(1);
    expect(mock.updateMany).toHaveBeenCalledWith({ where: { id: 3, syncedAt: null }, data: {
      attempts: { increment: 1 }, lastError: "Google Sheets HTTP 503", nextAttemptAt: expect.any(Date),
    } });
  });

  it("preserves pending jobs when configuration is missing", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "");
    const { syncOrderSheets } = await import("./google-sheets");
    expect(await syncOrderSheets()).toEqual({ configured: false, synced: 0, failed: 0 });
    expect(mock.findMany).not.toHaveBeenCalled();
  });

  it("adds grid rows before writing an order beyond the current grid", async () => {
    const fetch = googleFetch(200, 2); vi.stubGlobal("fetch", fetch);
    const { syncOrderSheets } = await import("./google-sheets");
    expect((await syncOrderSheets()).synced).toBe(1);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      "https://oauth2.googleapis.com/token",
      expect.stringContaining("?fields="), expect.stringContaining(":batchUpdate"),
      expect.stringContaining("values:batchUpdate"),
    ]);
  });

  it("re-queues an order's row with its current status and payment", async () => {
    mock.findOrder.mockResolvedValue({
      id: "order-1", orderNumber: "HORA-1", createdAt: new Date("2026-10-08T08:00:00Z"), updatedAt: new Date("2026-10-09T09:00:00Z"),
      customerFirstName: "Amira", customerLastName: "Ben Salem", phone: "+21622111222", postalCode: "2070",
      subtotalMillimes: 100000, deliveryFeeMillimes: 8000, totalMillimes: 108000, status: "SHIPPED", paymentStatus: "UNPAID",
      items: [{ sku: "W-1", productNameFr: "Atlas", variantLabelFr: "Standard", quantity: 1 }],
    });
    const { queueOrderSheetRefresh } = await import("./google-sheets");
    await queueOrderSheetRefresh("order-1");
    const call = mock.upsert.mock.calls[0]![0] as { where: unknown; update: { values: unknown[]; syncedAt: null }; create: unknown };
    expect(call.where).toEqual({ orderId: "order-1" });
    expect(call.update.syncedAt).toBeNull();
    expect(call.update.values.slice(-3)).toEqual(["SHIPPED", "UNPAID", "2026-10-09T09:00:00.000Z"]);
  });
});
