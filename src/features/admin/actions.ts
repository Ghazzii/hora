"use server";

import {
  InventoryReason,
  OrderStatus,
  PaymentStatus,
  Prisma,
  ReviewStatus,
} from "@prisma/client";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z, ZodError } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { OrderError, transitionOrder, updatePaymentStatus } from "@/lib/orders";
import { queueOrderSheetRefresh, syncOrderSheets } from "@/lib/google-sheets";
import { revalidateCatalog } from "@/lib/cache";
import { imageUrlProblem } from "@/lib/storage";
import { syncProductsFromSheet } from "@/lib/product-sheet";
import { ProductSheetError } from "@/lib/product-sheet-row";
import { failure, success, type ActionState } from "@/features/admin/action-state";

const statusSchema = z.nativeEnum(OrderStatus);
const paymentSchema = z.nativeEnum(PaymentStatus);
const reviewStatusSchema = z.nativeEnum(ReviewStatus);
const imageUrlSchema = z.string().max(500).superRefine((value, context) => {
  const problem = imageUrlProblem(value);
  if (problem) context.addIssue({ code: "custom", message: problem });
});

function text(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function optionalText(form: FormData, name: string) {
  const value = text(form, name);
  return value || null;
}

function millimes(form: FormData, name: string) {
  const value = Number(text(form, name).replace(",", "."));
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000) throw new RangeError(`Enter a valid amount for ${name.replace(/Dt$/, "")}.`);
  return Math.round(value * 1000);
}

/** Runs an admin mutation and turns expected failures into a readable toast message. */
async function attempt(work: () => Promise<string>): Promise<ActionState> {
  try {
    return success(await work());
  } catch (error) {
    if (error instanceof OrderError) return failure(error.message);
    if (error instanceof ZodError) return failure(error.issues[0]?.message ?? "Some fields are invalid.");
    if (error instanceof RangeError || error instanceof ProductSheetError) return failure(error.message);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return failure("That SKU or URL slug is already used by another product.");
      if (error.code === "P2025") return failure("This record no longer exists. Refresh the page.");
      if (error.code === "P2034") return failure("Someone else changed this at the same time. Please try again.");
    }
    console.error("Admin action failed", error);
    return failure("Something went wrong. Please try again.");
  }
}

function syncSheetLater(orderId: string) {
  after(async () => {
    try { await syncOrderSheets(orderId); } catch { console.error("Order sheet sync unavailable; cron will retry"); }
  });
}

export async function updateOrderStatusAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const orderId = text(form, "orderId");
  return attempt(async () => {
    const toStatus = statusSchema.parse(text(form, "toStatus"));
    const updated = await transitionOrder(orderId, toStatus, admin.id, optionalText(form, "note") ?? undefined);
    if (updated.restocked) revalidateCatalog();
    syncSheetLater(orderId);
    revalidatePath("/admin", "layout");
    return `Order ${updated.orderNumber} is now ${toStatus.toLowerCase()}${updated.restocked ? " — stock restored" : ""}.`;
  });
}

export async function updatePaymentStatusAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const orderId = text(form, "orderId");
  return attempt(async () => {
    const paymentStatus = paymentSchema.parse(text(form, "paymentStatus"));
    await updatePaymentStatus(orderId, paymentStatus, admin.id);
    syncSheetLater(orderId);
    revalidatePath(`/admin/orders/${orderId}`);
    return "Payment status saved.";
  });
}

export async function updateOrderNotesAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const orderId = text(form, "orderId");
  return attempt(async () => {
    await db.order.update({ where: { id: orderId }, data: { adminNotes: optionalText(form, "adminNotes")?.slice(0, 3000) ?? null } });
    revalidatePath(`/admin/orders/${orderId}`);
    return "Internal notes saved.";
  });
}

export async function adjustInventoryAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  return attempt(async () => {
    const variantId = text(form, "variantId");
    const delta = z.coerce.number({ invalid_type_error: "Enter a whole number." }).int("Enter a whole number.").min(-10000).max(10000).refine((value) => value !== 0, "Enter a change other than 0.").parse(text(form, "delta"));
    const note = z.string().trim().min(3, "Add a short reason (3+ characters).").max(500).parse(text(form, "note"));
    const stock = await db.$transaction(async (tx) => {
      // Conditional update keeps concurrent adjustments and checkouts from driving stock negative.
      const changed = await tx.productVariant.updateMany({ where: { id: variantId, stock: { gte: -delta } }, data: { stock: { increment: delta } } });
      if (changed.count !== 1) throw new RangeError("Stock cannot go below zero.");
      await tx.inventoryMovement.create({ data: { productVariantId: variantId, actorUserId: admin.id, delta, reason: InventoryReason.ADMIN_ADJUSTMENT, note } });
      return (await tx.productVariant.findUniqueOrThrow({ where: { id: variantId }, select: { stock: true } })).stock;
    });
    revalidateCatalog();
    revalidatePath("/admin", "layout");
    return `Stock ${delta > 0 ? "increased" : "reduced"} by ${Math.abs(delta)} — now ${stock}.`;
  });
}

export async function moderateReviewAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  return attempt(async () => {
    const reviewId = text(form, "reviewId");
    const status = reviewStatusSchema.parse(text(form, "status"));
    const review = await db.review.update({ where: { id: reviewId }, data: { status } });
    const approved = await db.review.aggregate({ where: { productId: review.productId, status: ReviewStatus.APPROVED }, _avg: { rating: true } });
    await db.product.update({ where: { id: review.productId }, data: { averageRating: approved._avg.rating ?? 0 } });
    revalidateCatalog();
    revalidatePath("/admin/reviews");
    return status === "APPROVED" ? "Review published." : status === "REJECTED" ? "Review rejected." : "Review moved back to pending.";
  });
}

export async function toggleProductAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  return attempt(async () => {
    const productId = text(form, "productId");
    const active = text(form, "active") === "true";
    const product = await db.product.update({ where: { id: productId }, data: { active } });
    revalidateCatalog();
    revalidatePath("/admin/products");
    return `${product.nameFr} is now ${active ? "visible in the store" : "hidden from the store"}.`;
  });
}

export async function saveProductAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const productId = optionalText(form, "productId");
  let savedId: string | null = null;
  const result = await attempt(async () => {
    const nameFr = z.string().min(2, "Product name needs at least 2 characters.").max(120).parse(text(form, "nameFr"));
    const nameEn = optionalText(form, "nameEn") ?? nameFr;
    const categoryId = z.string().uuid("Choose a category.").parse(text(form, "categoryId"));
    const sku = (optionalText(form, "sku") ?? `HORA-${slugify(nameFr)}`).slice(0, 60).toUpperCase();
    const images = text(form, "imageUrls").split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 8).map((url) => imageUrlSchema.parse(url));
    if (!images.length) images.push("/images/watch-1.svg");
    const lowStockThreshold = z.coerce.number().int().min(0).max(1000).parse(text(form, "lowStockThreshold") || "3");
    const compareAt = optionalText(form, "compareAtDt") ? millimes(form, "compareAtDt") : null;
    const price = millimes(form, "priceDt");
    if (compareAt !== null && compareAt <= price) throw new RangeError("The “compare at” price must be higher than the selling price.");
    const productData = {
      categoryId,
      sku,
      slugFr: slugify(optionalText(form, "slugFr") ?? nameFr),
      slugEn: slugify(optionalText(form, "slugEn") ?? nameEn),
      nameFr,
      nameEn,
      descriptionFr: (optionalText(form, "descriptionFr") ?? `Découvrez ${nameFr}, une montre Hora pensée pour le quotidien.`).slice(0, 3000),
      descriptionEn: (optionalText(form, "descriptionEn") ?? `Discover ${nameEn}, a Hora watch designed for everyday life.`).slice(0, 3000),
      brand: optionalText(form, "brand") ?? "Hora",
      gender: optionalText(form, "gender") ?? "Unisex",
      movement: optionalText(form, "movement") ?? "Quartz",
      caseMaterial: optionalText(form, "caseMaterial") ?? "Stainless steel",
      strapMaterial: optionalText(form, "strapMaterial") ?? "Leather",
      style: optionalText(form, "style") ?? "Classic",
      color: optionalText(form, "color") ?? "Black",
      waterResistance: optionalText(form, "waterResistance") ?? "5 ATM",
      featured: form.get("featured") === "on",
      active: form.get("active") === "on",
    };
    const imageRows = images.map((url, index) => ({ url, altFr: `${nameFr} ${index + 1}`, altEn: `${nameEn} ${index + 1}`, sortOrder: index }));

    if (productId) {
      await db.$transaction(async (tx) => {
        await tx.product.update({ where: { id: productId }, data: productData });
        await tx.productImage.deleteMany({ where: { productId } });
        await tx.productImage.createMany({ data: imageRows.map((row) => ({ ...row, productId })) });
        const variantId = optionalText(form, "variantId");
        if (variantId) {
          await tx.productVariant.update({
            where: { id: variantId },
            data: { priceMillimes: price, compareAtPriceMillimes: compareAt, lowStockThreshold },
          });
        }
      });
      savedId = productId;
    } else {
      const product = await db.product.create({
        data: {
          ...productData,
          images: { create: imageRows },
          variants: {
            create: {
              sku: (optionalText(form, "variantSku") ?? `${sku}-STD`).toUpperCase(),
              labelFr: optionalText(form, "variantLabelFr") ?? "Standard",
              labelEn: optionalText(form, "variantLabelEn") ?? "Standard",
              attributes: {},
              priceMillimes: price,
              compareAtPriceMillimes: compareAt,
              stock: z.coerce.number().int("Starting stock must be a whole number.").min(0).max(100000).parse(text(form, "initialStock") || "0"),
              lowStockThreshold,
            },
          },
        },
      });
      savedId = product.id;
    }
    revalidateCatalog();
    revalidatePath("/admin/products");
    return productId ? "Product saved." : "Product created.";
  });
  // Newly created products open their edit page (redirect must happen outside the try/catch).
  if (!productId && savedId && result.status === "success") redirect(`/admin/products/${savedId}?created=1`);
  if (savedId) revalidatePath(`/admin/products/${savedId}`);
  return result;
}

/**
 * Permanently deletes a product with its options, photos list, reviews and wishlist entries.
 * Past orders are unaffected: each order line keeps its own name, SKU, price and photo snapshot.
 * Stock-movement history for the product's options is removed with it (it references the options).
 */
export async function deleteProductAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  let deletedName: string | null = null;
  const result = await attempt(async () => {
    const productId = z.string().uuid().parse(text(form, "productId"));
    const product = await db.$transaction(async (tx) => {
      const existing = await tx.product.findUniqueOrThrow({ where: { id: productId }, select: { nameFr: true } });
      await tx.inventoryMovement.deleteMany({ where: { productVariant: { productId } } });
      await tx.product.delete({ where: { id: productId } });
      return existing;
    });
    deletedName = product.nameFr;
    revalidateCatalog();
    revalidatePath("/admin", "layout");
    return `${product.nameFr} was deleted.`;
  });
  if (deletedName && result.status === "success") redirect(`/admin/products?deleted=${encodeURIComponent(deletedName)}`);
  return result;
}

export async function addVariantAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  return attempt(async () => {
    const productId = z.string().uuid().parse(text(form, "productId"));
    const product = await db.product.findUniqueOrThrow({ where: { id: productId }, select: { sku: true } });
    const labelFr = z.string().min(2, "Give the option a French label (2+ characters).").max(100).parse(text(form, "labelFr"));
    await db.productVariant.create({
      data: {
        productId,
        sku: (optionalText(form, "sku") ?? `${product.sku}-${slugify(labelFr).toUpperCase()}`).slice(0, 80).toUpperCase(),
        labelFr,
        labelEn: optionalText(form, "labelEn") ?? labelFr,
        attributes: {},
        priceMillimes: millimes(form, "priceDt"),
        stock: z.coerce.number().int().min(0).max(100000).parse(text(form, "stock") || "0"),
        lowStockThreshold: 3,
      },
    });
    revalidateCatalog();
    revalidatePath(`/admin/products/${productId}`);
    return `Option “${labelFr}” added.`;
  });
}

export async function updateVariantAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  return attempt(async () => {
    const variantId = z.string().uuid().parse(text(form, "variantId"));
    const variant = await db.productVariant.update({
      where: { id: variantId },
      data: {
        labelFr: z.string().min(2).max(100).parse(text(form, "labelFr")),
        labelEn: optionalText(form, "labelEn") ?? text(form, "labelFr"),
        priceMillimes: millimes(form, "priceDt"),
        active: form.get("active") === "on",
      },
    });
    revalidateCatalog();
    revalidatePath(`/admin/products/${variant.productId}`);
    return "Option saved.";
  });
}

export async function syncSheetsAction(): Promise<ActionState> {
  await requireAdmin();
  return attempt(async () => {
    const result = await syncOrderSheets();
    revalidatePath("/admin", "layout");
    if (!result.configured) throw new RangeError("Google Sheets is not configured on this deployment.");
    if (result.failed) throw new RangeError(`${result.synced} row(s) synced, ${result.failed} failed — they will retry automatically.`);
    return result.synced ? `${result.synced} row(s) written to Google Sheets.` : "Google Sheets is already up to date.";
  });
}

/** Imports the "Products" tab; row problems are listed rather than failing the whole sync. */
export async function syncProductsAction(): Promise<ActionState & { issues?: string[] }> {
  await requireAdmin();
  let issues: string[] = [];
  const result = await attempt(async () => {
    const sync = await syncProductsFromSheet();
    issues = sync.issues;
    revalidatePath("/admin", "layout");
    const parts = [
      sync.created && `${sync.created} new`,
      sync.updated && `${sync.updated} updated`,
      sync.hiddenProducts && `${sync.hiddenProducts} hidden`,
      sync.hiddenVariants && `${sync.hiddenVariants} option(s) hidden`,
    ].filter(Boolean);
    return `Products synced${parts.length ? `: ${parts.join(", ")}` : ""}.${issues.length ? ` ${issues.length} row(s) need attention.` : ""}`;
  });
  return { ...result, issues };
}

/** Re-queues every order so the sheet shows current status and payment, including older rows. */
export async function rebuildSheetsAction(): Promise<ActionState> {
  await requireAdmin();
  return attempt(async () => {
    const orders = await db.order.findMany({ select: { id: true }, orderBy: { createdAt: "asc" } });
    for (const order of orders) await queueOrderSheetRefresh(order.id);
    const result = await syncOrderSheets();
    revalidatePath("/admin", "layout");
    return `${orders.length} order row(s) queued; ${result.synced} written now, the rest sync automatically.`;
  });
}
