import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportPKCS8, generateKeyPair } from "jose";

const mock = vi.hoisted(() => ({ findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { orderSheetExport: mock } }));

describe("order spreadsheet delivery", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("GOOGLE_SHEETS_SPREADSHEET_ID", "test-sheet");
    vi.stubEnv("GOOGLE_SHEETS_TAB_NAME", "Orders");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "orders@test.iam.gserviceaccount.com");
    const { privateKey } = await generateKeyPair("RS256", { extractable: true });
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", await exportPKCS8(privateKey));
    mock.findMany.mockResolvedValue([{ id: 3, orderId: "order-1", values: ["=IMPORTXML(secret)", "+21622555666", "0200"], attempts: 0 }]);
    mock.update.mockResolvedValue({});
    mock.updateMany.mockResolvedValue({ count: 1 });
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  function googleFetch(status = 200, rowCount = 1000) {
    return vi.fn(async (url: string) => {
      if (url.includes("oauth2")) return Response.json({ access_token: "test-token", expires_in: 3600 });
      if (url.includes("?fields=")) return Response.json({ sheets: [{ properties: { sheetId: 0, title: "Orders", gridProperties: { rowCount } } }] });
      return Response.json({}, { status });
    });
  }

  it("writes RAW values to the same row on repeated delivery", async () => {
    const fetch = googleFetch(); vi.stubGlobal("fetch", fetch);
    const { syncOrderSheets } = await import("./google-sheets");
    expect(await syncOrderSheets("order-1")).toEqual({ configured: true, synced: 1, failed: 0 });
    await syncOrderSheets("order-1");
    const writes = fetch.mock.calls.filter(([url]) => url.includes("valueInputOption=RAW"));
    expect(writes).toHaveLength(2);
    expect(writes[0]![0]).toBe(writes[1]![0]);
    expect(decodeURIComponent(writes[0]![0])).toContain("'Orders'!A4:T4");
    expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ syncedAt: expect.any(Date) }) }));
  });

  it("keeps failed writes pending and schedules a retry without leaking response data", async () => {
    vi.stubGlobal("fetch", googleFetch(503)); vi.spyOn(console, "error").mockImplementation(() => {});
    const { syncOrderSheets } = await import("./google-sheets");
    expect(await syncOrderSheets()).toEqual({ configured: true, synced: 0, failed: 1 });
    expect(mock.update).not.toHaveBeenCalled();
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
      expect.stringContaining("valueInputOption=RAW"),
    ]);
  });
});
