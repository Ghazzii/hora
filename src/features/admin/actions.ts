"use server";

import {
  InventoryReason,
  OrderStatus,
  PaymentStatus,
  ReviewStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { transitionOrder } from "@/lib/orders";

const statusSchema = z.nativeEnum(OrderStatus);
const paymentSchema = z.nativeEnum(PaymentStatus);
const reviewStatusSchema = z.nativeEnum(ReviewStatus);

function text(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function optionalText(form: FormData, name: string) {
  const value = text(form, name);
  return value || null;
}

function millimes(form: FormData, name: string) {
  const value = Number(text(form, name));
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid ${name}`);
  return Math.round(value * 1000);
}

export async function updateOrderStatusAction(form: FormData) {
  const admin = await requireAdmin();
  const orderId = text(form, "orderId");
  const toStatus = statusSchema.parse(text(form, "toStatus"));
  await transitionOrder(orderId, toStatus, admin.id, optionalText(form, "note") ?? undefined);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
}

export async function updateOrderNotesAction(form: FormData) {
  await requireAdmin();
  const orderId = text(form, "orderId");
  await db.order.update({
    where: { id: orderId },
    data: { adminNotes: optionalText(form, "adminNotes")?.slice(0, 3000) },
  });
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updatePaymentStatusAction(form: FormData) {
  const admin = await requireAdmin();
  const orderId = text(form, "orderId");
  const paymentStatus = paymentSchema.parse(text(form, "paymentStatus"));
  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { paymentStatus } }),
    db.orderStatusHistory.create({
      data: {
        orderId,
        toStatus: (await db.order.findUniqueOrThrow({ where: { id: orderId } })).status,
        actorUserId: admin.id,
        note: `COD payment status changed to ${paymentStatus}`,
      },
    }),
  ]);
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function adjustInventoryAction(form: FormData) {
  const admin = await requireAdmin();
  const variantId = text(form, "variantId");
  const delta = z.coerce.number().int().min(-10000).max(10000).parse(text(form, "delta"));
  const note = z.string().trim().min(3).max(500).parse(text(form, "note"));
  await db.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    if (variant.stock + delta < 0) throw new Error("Stock cannot be negative");
    await tx.productVariant.update({ where: { id: variantId }, data: { stock: { increment: delta } } });
    await tx.inventoryMovement.create({
      data: {
        productVariantId: variantId,
        actorUserId: admin.id,
        delta,
        reason: InventoryReason.ADMIN_ADJUSTMENT,
        note,
      },
    });
  });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
}

export async function moderateReviewAction(form: FormData) {
  await requireAdmin();
  const reviewId = text(form, "reviewId");
  const status = reviewStatusSchema.parse(text(form, "status"));
  const review = await db.review.update({
    where: { id: reviewId },
    data: { status },
    include: { product: { include: { reviews: { where: { status: ReviewStatus.APPROVED } } } } },
  });
  const approved = await db.review.findMany({ where: { productId: review.productId, status: ReviewStatus.APPROVED }, select: { rating: true } });
  await db.product.update({
    where: { id: review.productId },
    data: { averageRating: approved.length ? approved.reduce((sum, item) => sum + item.rating, 0) / approved.length : 0 },
  });
  revalidatePath("/admin/reviews");
}

export async function toggleProductAction(form: FormData) {
  await requireAdmin();
  const productId = text(form, "productId");
  const active = text(form, "active") === "true";
  await db.product.update({ where: { id: productId }, data: { active } });
  revalidatePath("/admin/products");
  revalidatePath("/fr/montres");
  revalidatePath("/en/montres");
}

export async function saveProductAction(form: FormData) {
  await requireAdmin();
  const productId = optionalText(form, "productId");
  const nameFr = z.string().min(2).max(120).parse(text(form, "nameFr"));
  const nameEn = z.string().min(2).max(120).parse(text(form, "nameEn"));
  const categoryId = z.string().uuid().parse(text(form, "categoryId"));
  const sku = z.string().min(3).max(60).parse(text(form, "sku")).toUpperCase();
  const images = text(form, "imageUrls").split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 8);
  if (!images.length) images.push("/images/watch-1.svg");
  const productData = {
    categoryId,
    sku,
    slugFr: slugify(optionalText(form, "slugFr") ?? nameFr),
    slugEn: slugify(optionalText(form, "slugEn") ?? nameEn),
    nameFr,
    nameEn,
    descriptionFr: z.string().min(20).max(3000).parse(text(form, "descriptionFr")),
    descriptionEn: z.string().min(20).max(3000).parse(text(form, "descriptionEn")),
    brand: z.string().min(1).max(80).parse(text(form, "brand")),
    gender: z.string().min(1).max(40).parse(text(form, "gender")),
    movement: z.string().min(1).max(80).parse(text(form, "movement")),
    caseMaterial: z.string().min(1).max(120).parse(text(form, "caseMaterial")),
    strapMaterial: z.string().min(1).max(120).parse(text(form, "strapMaterial")),
    style: z.string().min(1).max(80).parse(text(form, "style")),
    color: z.string().min(1).max(80).parse(text(form, "color")),
    waterResistance: z.string().min(1).max(80).parse(text(form, "waterResistance")),
    featured: form.get("featured") === "on",
    active: form.get("active") === "on",
  };

  let savedId: string;
  if (productId) {
    const product = await db.product.update({ where: { id: productId }, data: productData });
    savedId = product.id;
    await db.productImage.deleteMany({ where: { productId } });
    await db.productImage.createMany({
      data: images.map((url, index) => ({ productId, url, altFr: `${nameFr} ${index + 1}`, altEn: `${nameEn} ${index + 1}`, sortOrder: index })),
    });
    const variantId = optionalText(form, "variantId");
    if (variantId) {
      await db.productVariant.update({
        where: { id: variantId },
        data: {
          sku: text(form, "variantSku").toUpperCase(),
          labelFr: text(form, "variantLabelFr"),
          labelEn: text(form, "variantLabelEn"),
          priceMillimes: millimes(form, "priceDt"),
          compareAtPriceMillimes: optionalText(form, "compareAtDt") ? millimes(form, "compareAtDt") : null,
          lowStockThreshold: z.coerce.number().int().min(0).parse(text(form, "lowStockThreshold")),
          active: form.get("variantActive") === "on",
        },
      });
    }
  } else {
    const product = await db.product.create({
      data: {
        ...productData,
        images: {
          create: images.map((url, index) => ({ url, altFr: `${nameFr} ${index + 1}`, altEn: `${nameEn} ${index + 1}`, sortOrder: index })),
        },
        variants: {
          create: {
            sku: text(form, "variantSku").toUpperCase(),
            labelFr: text(form, "variantLabelFr"),
            labelEn: text(form, "variantLabelEn"),
            attributes: {},
            priceMillimes: millimes(form, "priceDt"),
            stock: z.coerce.number().int().min(0).parse(text(form, "initialStock")),
            lowStockThreshold: z.coerce.number().int().min(0).parse(text(form, "lowStockThreshold")),
          },
        },
      },
    });
    savedId = product.id;
  }
  revalidatePath("/admin/products");
  revalidatePath("/fr/montres");
  revalidatePath("/en/montres");
  redirect(`/admin/products/${savedId}`);
}

export async function addVariantAction(form: FormData) {
  await requireAdmin();
  const productId = z.string().uuid().parse(text(form, "productId"));
  await db.productVariant.create({
    data: {
      productId,
      sku: z.string().min(3).max(80).parse(text(form, "sku")).toUpperCase(),
      labelFr: z.string().min(2).max(100).parse(text(form, "labelFr")),
      labelEn: z.string().min(2).max(100).parse(text(form, "labelEn")),
      attributes: {},
      priceMillimes: millimes(form, "priceDt"),
      stock: z.coerce.number().int().min(0).parse(text(form, "stock")),
      lowStockThreshold: 3,
    },
  });
  revalidatePath(`/admin/products/${productId}`);
}
