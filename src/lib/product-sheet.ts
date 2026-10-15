import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { revalidateCatalog } from "@/lib/cache";
import { accessToken, sheetsConfigured } from "@/lib/google-sheets";
import { quotedTab } from "@/lib/order-sheet-row";
import { parseProductSheet, PRODUCT_SHEET_HEADERS, ProductSheetError, type SheetProduct } from "@/lib/product-sheet-row";
import { slugify } from "@/lib/utils";

export function productTabName() {
  return process.env.GOOGLE_SHEETS_PRODUCTS_TAB_NAME ?? "Products";
}

const tabIds = new Map<string, number>();

/** Link straight to the Products tab; the plain spreadsheet link would open whichever tab comes first (Orders). */
export async function productSheetUrl() {
  const spreadsheet = encodeURIComponent(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!);
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheet}/edit`;
  const tab = productTabName();
  try {
    if (!tabIds.has(tab)) {
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet}?fields=sheets(properties(sheetId,title))`, {
        headers: { authorization: `Bearer ${await accessToken()}` }, signal: AbortSignal.timeout(5_000), cache: "no-store",
      });
      if (!response.ok) return url;
      const info = await response.json() as { sheets?: { properties: { sheetId: number; title: string } }[] };
      const id = info.sheets?.find((sheet) => sheet.properties.title === tab)?.properties.sheetId;
      // Only a found tab is remembered, so the link picks up the tab as soon as the first sync creates it.
      if (id === undefined) return url;
      tabIds.set(tab, id);
    }
    return `${url}#gid=${tabIds.get(tab)}`;
  } catch {
    return url;
  }
}

/** First sync on a new spreadsheet: add the tab with its header row frozen, so there is a template to fill in. */
async function createProductTab(spreadsheet: string, tab: string) {
  const headers = { authorization: `Bearer ${await accessToken()}`, "content-type": "application/json" };
  const added = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet}:batchUpdate`, {
    method: "POST", headers, signal: AbortSignal.timeout(10_000), cache: "no-store",
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tab, gridProperties: { frozenRowCount: 1 } } } }] }),
  });
  if (!added.ok) return false;
  const written = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet}/values/${encodeURIComponent(`${quotedTab(tab)}!A1`)}?valueInputOption=RAW`, {
    method: "PUT", headers, signal: AbortSignal.timeout(10_000), cache: "no-store",
    body: JSON.stringify({ values: [PRODUCT_SHEET_HEADERS] }),
  });
  return written.ok;
}

async function readProductTab() {
  const tab = productTabName();
  const spreadsheet = encodeURIComponent(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!);
  // Unformatted values give plain numbers for price cells formatted as "450,000 DT".
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet}/values/${encodeURIComponent(quotedTab(tab))}?valueRenderOption=UNFORMATTED_VALUE`, {
    headers: { authorization: `Bearer ${await accessToken()}` }, signal: AbortSignal.timeout(10_000), cache: "no-store",
  });
  if (response.status === 400) {
    if (await createProductTab(spreadsheet, tab)) throw new ProductSheetError(`A “${tab}” tab with the column headers was added to the spreadsheet. Fill in one row per watch option, then sync again.`);
    throw new ProductSheetError(`Add a tab named “${tab}” to the spreadsheet with these headers in row 1: ${PRODUCT_SHEET_HEADERS.join(", ")}.`);
  }
  if (response.status === 403 || response.status === 404) throw new ProductSheetError("The site can't open the spreadsheet. Share it with the service account email (Viewer is enough).");
  if (!response.ok) throw new Error(`Google Sheets HTTP ${response.status}`);
  return ((await response.json()) as { values?: unknown[][] }).values ?? [];
}

async function freeSlug(tx: Prisma.TransactionClient, field: "slugFr" | "slugEn", name: string, code: string) {
  const slug = slugify(name) || slugify(code);
  const taken = await tx.product.findFirst({ where: { [field]: slug }, select: { id: true } });
  return taken ? `${slug}-${slugify(code)}` : slug;
}

/** Creates or updates one watch and its variants; returns true when the watch is new. */
async function saveProduct(tx: Prisma.TransactionClient, item: SheetProduct, categoryId: string) {
  const existing = await tx.product.findUnique({ where: { sku: item.sku } });
  const nameEn = item.nameEn ?? existing?.nameEn ?? item.nameFr;
  const details = {
    categoryId,
    nameFr: item.nameFr,
    nameEn,
    descriptionFr: item.descriptionFr ?? existing?.descriptionFr ?? `Découvrez ${item.nameFr}, une montre Hora pensée pour le quotidien.`,
    descriptionEn: item.descriptionEn ?? existing?.descriptionEn ?? `Discover ${nameEn}, a Hora watch designed for everyday life.`,
    brand: item.brand ?? existing?.brand ?? "Hora",
    gender: item.gender ?? existing?.gender ?? "Unisex",
    movement: item.movement ?? existing?.movement ?? "Quartz",
    caseMaterial: item.caseMaterial ?? existing?.caseMaterial ?? "Stainless steel",
    strapMaterial: item.strapMaterial ?? existing?.strapMaterial ?? "Leather",
    style: item.style ?? existing?.style ?? "Classic",
    color: item.color ?? existing?.color ?? "Black",
    waterResistance: item.waterResistance ?? existing?.waterResistance ?? "5 ATM",
    featured: item.featured ?? existing?.featured ?? false,
    active: item.variants.some((variant) => variant.active),
    sheetManaged: true,
  };
  // Slugs are set once so shared links and search results keep working after a rename.
  const product = existing
    ? await tx.product.update({ where: { id: existing.id }, data: details })
    : await tx.product.create({ data: { ...details, sku: item.sku, slugFr: await freeSlug(tx, "slugFr", item.nameFr, item.sku), slugEn: await freeSlug(tx, "slugEn", nameEn, item.sku) } });

  const images = item.images ?? (existing ? null : ["/images/watch-1.svg"]);
  if (images) {
    await tx.productImage.deleteMany({ where: { productId: product.id } });
    await tx.productImage.createMany({ data: images.map((url, index) => ({ productId: product.id, url, altFr: `${item.nameFr} ${index + 1}`, altEn: `${nameEn} ${index + 1}`, sortOrder: index })) });
  }

  for (const variant of item.variants) {
    const owner = await tx.productVariant.findUnique({ where: { sku: variant.sku }, select: { productId: true } });
    if (owner && owner.productId !== product.id) throw new ProductSheetError(`SKU ${variant.sku} already belongs to another product`);
    const data = { labelFr: variant.labelFr, labelEn: variant.labelEn, priceMillimes: variant.priceMillimes, compareAtPriceMillimes: variant.compareAtPriceMillimes, active: variant.active, sheetManaged: true };
    // Stock is left to the site: orders and the inventory page change it, a sync never does.
    await tx.productVariant.upsert({ where: { sku: variant.sku }, update: data, create: { ...data, productId: product.id, sku: variant.sku, attributes: {}, stock: 0 } });
  }
  return !existing;
}

function reason(error: unknown) {
  if (error instanceof ProductSheetError) return error.message;
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "its name or code clashes with another product";
  console.error("Product sheet row failed", error);
  return "it could not be saved";
}

/**
 * Brings the store catalog in line with the "Products" tab: new rows create watches, edited rows update
 * names, details, photos and prices, and rows removed from the sheet hide their watch or variant.
 * Products created in the admin and never listed in the sheet are left alone.
 */
export async function syncProductsFromSheet() {
  if (!sheetsConfigured()) throw new ProductSheetError("Google Sheets is not configured on this deployment.");
  const sheet = parseProductSheet(await readProductTab());
  // An empty tab is far more likely a mistake than a request to hide the whole catalog.
  if (!sheet.productSkus.size) throw new ProductSheetError(`The “${productTabName()}” tab has no product rows, so nothing was changed.`);

  const categories = await db.category.findMany({ select: { id: true, nameFr: true, nameEn: true, slugFr: true, slugEn: true } });
  const issues = [...sheet.issues];
  let created = 0;
  let updated = 0;
  for (const item of sheet.products) {
    const wanted = slugify(item.category);
    const category = categories.find((entry) => [entry.slugFr, entry.slugEn, entry.nameFr, entry.nameEn].some((name) => slugify(name) === wanted));
    if (!category) {
      issues.push(`Row ${item.row}: category “${item.category}” doesn't exist (use ${categories.map((entry) => entry.nameFr).join(", ") || "a category created in the admin"}) — ${item.sku} skipped.`);
      continue;
    }
    try {
      if (await db.$transaction((tx) => saveProduct(tx, item, category.id), { timeout: 20_000 })) created += 1;
      else updated += 1;
    } catch (error) {
      issues.push(`Row ${item.row}: ${item.sku} skipped because ${reason(error)}.`);
    }
  }

  const [hiddenProducts, hiddenVariants] = await db.$transaction([
    db.product.updateMany({ where: { sheetManaged: true, active: true, sku: { notIn: [...sheet.productSkus] } }, data: { active: false } }),
    db.productVariant.updateMany({ where: { sheetManaged: true, active: true, sku: { notIn: [...sheet.variantSkus] } }, data: { active: false } }),
  ]);
  revalidateCatalog();
  return { created, updated, hiddenProducts: hiddenProducts.count, hiddenVariants: hiddenVariants.count, issues };
}
