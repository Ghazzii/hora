import { imageUrlProblem } from "@/lib/storage";

/**
 * Columns of the "Products" tab, one row per variant (SKU). Rows sharing a product code form one watch;
 * the watch's details come from the first row of that code, so later rows only need the variant columns.
 * Headers are matched loosely: "Name (FR)", "name_fr" and "Name FR" are the same column, and order is free.
 */
export const PRODUCT_SHEET_HEADERS = [
  "Product code", "SKU", "Name FR", "Name EN", "Category", "Price (TND)", "Compare at price (TND)",
  "Variant FR", "Variant EN", "Active", "Featured", "Images", "Description FR", "Description EN",
  "Brand", "Gender", "Movement", "Case material", "Strap material", "Style", "Color", "Water resistance",
];

const REQUIRED = ["product_code", "name_fr", "category", "price"] as const;

const ALIASES: Record<string, string> = {
  product: "product_code", code: "product_code", variant_sku: "sku",
  compare_at: "compare_at_price", compare_price: "compare_at_price", old_price: "compare_at_price",
  option_fr: "variant_fr", option_en: "variant_en", photos: "images", image: "images",
};

export class ProductSheetError extends Error {}

export type SheetVariant = {
  row: number;
  sku: string;
  labelFr: string;
  labelEn: string;
  priceMillimes: number;
  compareAtPriceMillimes: number | null;
  active: boolean;
};

/** Optional details are null when left blank: new products get a default, existing ones keep their value. */
export type SheetProduct = {
  row: number;
  sku: string;
  category: string;
  nameFr: string;
  nameEn: string | null;
  descriptionFr: string | null;
  descriptionEn: string | null;
  brand: string | null;
  gender: string | null;
  movement: string | null;
  caseMaterial: string | null;
  strapMaterial: string | null;
  style: string | null;
  color: string | null;
  waterResistance: string | null;
  featured: boolean | null;
  /** Blank keeps the current photos, so pictures uploaded in the admin survive a sync. */
  images: string[] | null;
  variants: SheetVariant[];
};

export type ParsedProductSheet = {
  products: SheetProduct[];
  /** Human-readable problems, each starting with its sheet row number. */
  issues: string[];
  /** Every code and SKU written in the sheet, even on rows skipped for errors, so a typo never hides a product. */
  productSkus: Set<string>;
  variantSkus: Set<string>;
};

export function headerKey(header: unknown) {
  const key = String(header ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
    .replace(/_(tnd|dt)$/, "");
  return ALIASES[key] ?? key;
}

function cell(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function optional(value: unknown, max: number) {
  return cell(value).slice(0, max) || null;
}

/** Sheet amounts in dinars ("450", "1 250,5" or a number cell) to millimes. */
export function sheetMillimes(value: unknown) {
  const number = typeof value === "number" ? value : Number(cell(value).replace(/[\s ]|TND|DT/gi, "").replace(",", "."));
  if (!Number.isFinite(number) || number <= 0 || number > 1_000_000) return null;
  return Math.round(number * 1000);
}

/** true/false, null when blank, undefined when it's neither yes nor no. */
function yesNo(value: unknown): boolean | null | undefined {
  if (typeof value === "boolean") return value;
  const text = cell(value).toLowerCase();
  if (!text) return null;
  if (["yes", "y", "oui", "o", "true", "1", "x", "✓"].includes(text)) return true;
  if (["no", "n", "non", "false", "0"].includes(text)) return false;
  return undefined;
}

/** Turns the raw "Products" tab (header row first) into watches with their variants. */
export function parseProductSheet(values: unknown[][]): ParsedProductSheet {
  const [header = [], ...rows] = values;
  const columns = new Map<string, number>();
  header.forEach((name, index) => {
    const key = headerKey(name);
    if (key && !columns.has(key)) columns.set(key, index);
  });
  const missing = REQUIRED.filter((key) => !columns.has(key));
  if (missing.length) {
    throw new ProductSheetError(`The Products tab is missing the column${missing.length > 1 ? "s" : ""} ${missing.map((key) => `“${PRODUCT_SHEET_HEADERS.find((name) => headerKey(name) === key)}”`).join(", ")} in row 1.`);
  }

  const result: ParsedProductSheet = { products: [], issues: [], productSkus: new Set(), variantSkus: new Set() };
  const byCode = new Map<string, SheetProduct | null>();
  const usedSkus = new Set<string>();
  rows.forEach((raw, index) => {
    const row = index + 2;
    const get = (key: string) => (columns.has(key) ? raw[columns.get(key)!] : undefined);
    if (!raw.some((value) => cell(value))) return;
    const code = cell(get("product_code")).toUpperCase().slice(0, 60);
    const sku = (cell(get("sku")) || code).toUpperCase().slice(0, 80);
    if (code) result.productSkus.add(code);
    if (sku) result.variantSkus.add(sku);
    const skip = (reason: string) => { result.issues.push(`Row ${row}: ${reason} — row skipped.`); };
    if (!code) return skip("product code is empty");

    let product = byCode.get(code);
    if (product === undefined) {
      const nameFr = cell(get("name_fr")).slice(0, 120);
      const category = cell(get("category"));
      product = null;
      if (nameFr.length < 2) skip(`${code} needs a French name (2+ characters) on its first row`);
      else if (!category) skip(`${code} needs a category on its first row`);
      else {
        const featured = yesNo(get("featured"));
        const images: string[] = [];
        for (const url of cell(get("images")).split(/[\s,;]+/).filter(Boolean).slice(0, 8)) {
          const problem = url.length > 500 ? "Image link is too long." : imageUrlProblem(url);
          if (problem) result.issues.push(`Row ${row}: image ${url.slice(0, 60)} ignored. ${problem}`);
          else images.push(url);
        }
        product = {
          row, sku: code, category, nameFr,
          nameEn: optional(get("name_en"), 120),
          descriptionFr: optional(get("description_fr"), 3000),
          descriptionEn: optional(get("description_en"), 3000),
          brand: optional(get("brand"), 120),
          gender: optional(get("gender"), 120),
          movement: optional(get("movement"), 120),
          caseMaterial: optional(get("case_material"), 120),
          strapMaterial: optional(get("strap_material"), 120),
          style: optional(get("style"), 120),
          color: optional(get("color"), 120),
          waterResistance: optional(get("water_resistance"), 120),
          featured: featured === undefined ? null : featured,
          images: images.length ? images : null,
          variants: [],
        };
        if (featured === undefined) result.issues.push(`Row ${row}: “Featured” should be yes or no — left unchanged.`);
        result.products.push(product);
      }
      byCode.set(code, product);
      if (!product) return;
    }
    if (!product) return skip(`${code}'s first row has errors`);

    if (usedSkus.has(sku)) return skip(`SKU ${sku} is used twice in the sheet`);
    const priceMillimes = sheetMillimes(get("price"));
    if (priceMillimes === null) return skip(`price for ${sku} must be a number above 0`);
    const compareCell = cell(get("compare_at_price"));
    const compareAtPriceMillimes = compareCell ? sheetMillimes(get("compare_at_price")) : null;
    if (compareCell && compareAtPriceMillimes === null) return skip(`compare-at price for ${sku} must be a number above 0`);
    if (compareAtPriceMillimes !== null && compareAtPriceMillimes <= priceMillimes) return skip(`compare-at price for ${sku} must be higher than its price`);
    const active = yesNo(get("active"));
    if (active === undefined) return skip(`“Active” for ${sku} should be yes or no`);
    const labelFr = cell(get("variant_fr")).slice(0, 100) || "Standard";
    usedSkus.add(sku);
    product.variants.push({
      row, sku, labelFr,
      labelEn: cell(get("variant_en")).slice(0, 100) || (cell(get("variant_fr")) ? labelFr : "Standard"),
      priceMillimes, compareAtPriceMillimes, active: active ?? true,
    });
  });
  result.products = result.products.filter((product) => product.variants.length);
  return result;
}
