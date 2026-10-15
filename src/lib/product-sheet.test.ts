import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportPKCS8, generateKeyPair } from "jose";

const mock = vi.hoisted(() => ({
  findProduct: vi.fn(), createProduct: vi.fn(), updateProduct: vi.fn(), findFirstProduct: vi.fn(), hideProducts: vi.fn(),
  findVariant: vi.fn(), upsertVariant: vi.fn(), hideVariants: vi.fn(), deleteImages: vi.fn(), createImages: vi.fn(), categories: vi.fn(),
}));
vi.mock("@/lib/db", () => {
  const client = {
    product: { findUnique: mock.findProduct, create: mock.createProduct, update: mock.updateProduct, findFirst: mock.findFirstProduct, updateMany: mock.hideProducts },
    productVariant: { findUnique: mock.findVariant, upsert: mock.upsertVariant, updateMany: mock.hideVariants },
    productImage: { deleteMany: mock.deleteImages, createMany: mock.createImages },
    category: { findMany: mock.categories },
    $transaction: (work: unknown) => (typeof work === "function" ? work(client) : Promise.all(work as Promise<unknown>[])),
  };
  return { db: client };
});

const HEADER = ["Product code", "SKU", "Name FR", "Category", "Price (TND)"];

describe("product sheet sync", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("GOOGLE_SHEETS_SPREADSHEET_ID", "test-sheet");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "orders@test.iam.gserviceaccount.com");
    const { privateKey } = await generateKeyPair("RS256", { extractable: true });
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", await exportPKCS8(privateKey));
    mock.categories.mockResolvedValue([{ id: "cat-sport", nameFr: "Sport", nameEn: "Sport", slugFr: "sport", slugEn: "sport" }]);
    mock.findProduct.mockResolvedValue(null);
    mock.findFirstProduct.mockResolvedValue(null);
    mock.findVariant.mockResolvedValue(null);
    mock.createProduct.mockImplementation(async ({ data }) => ({ id: `id-${data.sku}`, ...data }));
    mock.hideProducts.mockResolvedValue({ count: 1 });
    mock.hideVariants.mockResolvedValue({ count: 2 });
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  function google(values: unknown[][] | null) {
    return vi.fn(async (url: string, _init?: RequestInit) => {
      if (url.includes("oauth2")) return Response.json({ access_token: "test-token", expires_in: 3600 });
      if (url.includes("/values/") && !_init?.method) return values ? Response.json({ values }) : Response.json({}, { status: 400 });
      return Response.json({});
    });
  }

  it("creates new watches, never touches stock, and hides only sheet-managed rows that disappeared", async () => {
    vi.stubGlobal("fetch", google([HEADER, ["W1", "W1-A", "Watch one", "sport", 120], ["W2", "W2-A", "Watch two", "Diving", 90]]));
    const { syncProductsFromSheet } = await import("./product-sheet");
    const result = await syncProductsFromSheet();
    expect(result).toMatchObject({ created: 1, updated: 0, hiddenProducts: 1, hiddenVariants: 2 });
    expect(result.issues).toEqual([expect.stringMatching(/^Row 3: category “Diving” doesn't exist \(use Sport\) — W2 skipped\.$/)]);
    expect(mock.createProduct.mock.calls[0]![0].data).toMatchObject({ sku: "W1", slugFr: "watch-one", categoryId: "cat-sport", sheetManaged: true, active: true });
    expect(mock.upsertVariant.mock.calls[0]![0]).toMatchObject({
      where: { sku: "W1-A" },
      update: expect.not.objectContaining({ stock: expect.anything() }),
      create: { sku: "W1-A", productId: "id-W1", priceMillimes: 120_000, stock: 0, sheetManaged: true },
    });
    // W2 was skipped for its category but is still in the sheet, so it must not be hidden.
    expect(mock.hideProducts).toHaveBeenCalledWith({ where: { sheetManaged: true, active: true, sku: { notIn: ["W1", "W2"] } }, data: { active: false } });
    expect(mock.hideVariants).toHaveBeenCalledWith({ where: { sheetManaged: true, active: true, sku: { notIn: ["W1-A", "W2-A"] } }, data: { active: false } });
  });

  it("refuses to hide the catalog when the tab has no rows", async () => {
    vi.stubGlobal("fetch", google([HEADER]));
    const { syncProductsFromSheet } = await import("./product-sheet");
    await expect(syncProductsFromSheet()).rejects.toThrow("has no product rows, so nothing was changed");
    expect(mock.hideProducts).not.toHaveBeenCalled();
  });

  it("creates the tab with headers on the first sync", async () => {
    const fetch = google(null); vi.stubGlobal("fetch", fetch);
    const { syncProductsFromSheet } = await import("./product-sheet");
    await expect(syncProductsFromSheet()).rejects.toThrow("tab with the column headers was added");
    const header = fetch.mock.calls.find(([, init]) => init?.method === "PUT");
    expect(JSON.parse(String(header![1]!.body)).values[0]).toEqual(expect.arrayContaining(["Product code", "SKU", "Price (TND)"]));
    expect(mock.hideProducts).not.toHaveBeenCalled();
  });

  it("links to the Products tab once it exists, and to the spreadsheet before that", async () => {
    let tabs = [{ properties: { sheetId: 0, title: "Orders" } }];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url.includes("oauth2")
      ? Response.json({ access_token: "test-token", expires_in: 3600 })
      : Response.json({ sheets: tabs })));
    const { productSheetUrl } = await import("./product-sheet");
    expect(await productSheetUrl()).toBe("https://docs.google.com/spreadsheets/d/test-sheet/edit");
    tabs = [...tabs, { properties: { sheetId: 98765, title: "Products" } }];
    expect(await productSheetUrl()).toBe("https://docs.google.com/spreadsheets/d/test-sheet/edit#gid=98765");
  });

  it("keeps an existing watch's slug and photos when those cells are blank", async () => {
    mock.findProduct.mockResolvedValue({ id: "p1", sku: "W1", nameEn: "Old EN", brand: "Hora", featured: true });
    mock.updateProduct.mockResolvedValue({ id: "p1" });
    mock.findVariant.mockResolvedValue({ productId: "p1" });
    vi.stubGlobal("fetch", google([HEADER, ["W1", "W1-A", "Renamed", "Sport", 99.5]]));
    const { syncProductsFromSheet } = await import("./product-sheet");
    expect(await syncProductsFromSheet()).toMatchObject({ created: 0, updated: 1 });
    const data = mock.updateProduct.mock.calls[0]![0].data;
    expect(data).toMatchObject({ nameFr: "Renamed", nameEn: "Old EN", brand: "Hora", featured: true });
    expect(data).not.toHaveProperty("slugFr");
    expect(mock.deleteImages).not.toHaveBeenCalled();
    expect(mock.upsertVariant.mock.calls[0]![0].update).toMatchObject({ priceMillimes: 99_500 });
  });
});
