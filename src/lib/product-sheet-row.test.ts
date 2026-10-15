import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { headerKey, parseProductSheet, ProductSheetError, sheetMillimes, type SheetProduct } from "./product-sheet-row";

const HEADER = ["Product code", "SKU", "Name (FR)", "Category", "Price (TND)", "Compare at price", "Variant FR", "Active", "Images"];

describe("product sheet parsing", () => {
  beforeEach(() => {
    vi.stubEnv("PRODUCT_IMAGE_HOST", "images.example.com");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("DIRECT_URL", "");
    vi.stubEnv("SUPABASE_URL", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("matches headers loosely", () => {
    expect(headerKey("Name (FR)")).toBe("name_fr");
    expect(headerKey(" Price (TND) ")).toBe("price");
    expect(headerKey("Matériau du boîtier")).toBe("materiau_du_boitier");
    expect(headerKey("Case material")).toBe("case_material");
  });

  it("reads dinar amounts written in different ways", () => {
    expect(sheetMillimes(450)).toBe(450_000);
    expect(sheetMillimes("1 250,5")).toBe(1_250_500);
    expect(sheetMillimes("89 DT")).toBe(89_000);
    expect(sheetMillimes("")).toBeNull();
    expect(sheetMillimes("free")).toBeNull();
    expect(sheetMillimes(0)).toBeNull();
  });

  it("groups variant rows under their product code, taking details from the first row", () => {
    const sheet = parseProductSheet([
      HEADER,
      ["aqua-01", "aqua-01-s", "Aqua Diver", "Sport", 450, 520, "Acier", "", "https://images.example.com/a.jpg, /images/b.jpg"],
      ["AQUA-01", "AQUA-01-C", "", "", "420", "", "Cuir", "non", ""],
      ["CLS-02", "", "Classic", "classiques", 690, "", "", "yes", ""],
      [],
    ]);
    expect(sheet.issues).toEqual([]);
    expect(sheet.products).toHaveLength(2);
    const [aqua, classic] = sheet.products as [SheetProduct, SheetProduct];
    expect(aqua).toMatchObject({ row: 2, sku: "AQUA-01", nameFr: "Aqua Diver", category: "Sport", images: ["https://images.example.com/a.jpg", "/images/b.jpg"] });
    expect(aqua.variants).toEqual([
      { row: 2, sku: "AQUA-01-S", labelFr: "Acier", labelEn: "Acier", priceMillimes: 450_000, compareAtPriceMillimes: 520_000, active: true },
      { row: 3, sku: "AQUA-01-C", labelFr: "Cuir", labelEn: "Cuir", priceMillimes: 420_000, compareAtPriceMillimes: null, active: false },
    ]);
    // A blank SKU falls back to the product code; blank optional details stay null so existing values are kept.
    expect(classic.variants[0]).toMatchObject({ sku: "CLS-02", labelFr: "Standard", labelEn: "Standard" });
    expect(classic).toMatchObject({ images: null, nameEn: null, brand: null, featured: null });
    expect([...sheet.productSkus]).toEqual(["AQUA-01", "CLS-02"]);
    expect([...sheet.variantSkus]).toEqual(["AQUA-01-S", "AQUA-01-C", "CLS-02"]);
  });

  it("skips bad rows with a readable reason but still counts their codes as present", () => {
    const sheet = parseProductSheet([
      HEADER,
      ["W1", "W1-A", "Watch one", "Sport", "abc", "", "", "", ""],
      ["W2", "W2-A", "", "Sport", 100, "", "", "", ""],
      ["W2", "W2-B", "", "", 100, "", "", "", ""],
      ["W3", "W3-A", "Watch three", "Sport", 100, 90, "", "", ""],
      ["W4", "W4-A", "Watch four", "Sport", 100, "", "", "maybe", "http://images.example.com/x.jpg https://evil.test/y.jpg"],
      ["W5", "W4-A", "Watch five", "Sport", 100, "", "", "", ""],
      ["", "LOOSE", "No code", "Sport", 100, "", "", "", ""],
    ]);
    expect(sheet.products.map((product) => product.sku)).toEqual(["W5"]);
    expect(sheet.issues).toEqual([
      "Row 2: price for W1-A must be a number above 0 — row skipped.",
      "Row 3: W2 needs a French name (2+ characters) on its first row — row skipped.",
      "Row 4: W2's first row has errors — row skipped.",
      "Row 5: compare-at price for W3-A must be higher than its price — row skipped.",
      "Row 6: image http://images.example.com/x.jpg ignored. Images must be https:// links or site paths like /images/…",
      expect.stringMatching(/^Row 6: image https:\/\/evil\.test\/y\.jpg ignored\. Images from evil\.test can't be displayed/),
      "Row 6: “Active” for W4-A should be yes or no — row skipped.",
      "Row 8: product code is empty — row skipped.",
    ]);
    // Nothing written in the sheet gets hidden just because its row has a mistake.
    expect(sheet.productSkus).toEqual(new Set(["W1", "W2", "W3", "W4", "W5"]));
    expect(sheet.variantSkus.has("LOOSE")).toBe(true);
  });

  it("rejects a SKU used twice", () => {
    const sheet = parseProductSheet([HEADER, ["A", "SAME", "Watch A", "Sport", 100], ["B", "SAME", "Watch B", "Sport", 100]]);
    expect(sheet.products.map((product) => product.sku)).toEqual(["A"]);
    expect(sheet.issues).toEqual(["Row 3: SKU SAME is used twice in the sheet — row skipped."]);
  });

  it("names the missing columns", () => {
    expect(() => parseProductSheet([["SKU", "Name FR"]])).toThrow(ProductSheetError);
    expect(() => parseProductSheet([["SKU", "Name FR"]])).toThrow("missing the columns “Product code”, “Category”, “Price (TND)”");
    expect(() => parseProductSheet([])).toThrow(ProductSheetError);
  });
});
