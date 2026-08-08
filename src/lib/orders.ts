import {
  AnalyticsEventType,
  InventoryReason,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env";
import { normalizeTunisianPhone } from "@/lib/phone";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";
import { calculateOrderPricing } from "@/lib/order-pricing";
import {
  canTransitionOrder,
  transitionRestocks,
} from "@/lib/order-rules";
import {
  sanitizeAttribution,
  type Attribution,
} from "@/lib/attribution";

export class OrderError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_INPUT"
      | "OUT_OF_STOCK"
      | "NOT_FOUND"
      | "INVALID_TRANSITION",
    public readonly status = 400,
  ) {
    super(message);
  }
}

function hashAccessToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function accessTokenFor(idempotencyKey: string) {
  return createHmac("sha256", serverEnv().SESSION_SECRET)
    .update(`hora-order:${idempotencyKey}`)
    .digest("base64url");
}

function orderNumber() {
  const date = new Date().toISOString().slice(0, 7).replace("-", "");
  return `HORA-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function createOrder(
  rawInput: CheckoutInput,
  rawAttribution: Attribution,
  userId?: string,
) {
  const parsed = checkoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new OrderError("Checkout information is invalid", "INVALID_INPUT");
  }
  const input = parsed.data;
  const accessToken = accessTokenFor(input.idempotencyKey);
  const attribution = sanitizeAttribution(rawAttribution);

  const existing = await db.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    return {
      orderId: existing.id,
      orderNumber: existing.orderNumber,
      accessToken,
      reused: true,
    };
  }

  const quantities = new Map<string, number>();
  for (const item of input.items) {
    quantities.set(
      item.variantId,
      (quantities.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  return db.$transaction(
    async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: {
          id: { in: [...quantities.keys()] },
          active: true,
          product: { active: true },
        },
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
          },
        },
      });
      if (variants.length !== quantities.size) {
        throw new OrderError(
          "One or more products are unavailable",
          "OUT_OF_STOCK",
          409,
        );
      }

      const lines = variants.map((variant) => ({
        variant,
        quantity: quantities.get(variant.id)!,
        unitPriceMillimes: variant.priceMillimes,
      }));
      const pricing = calculateOrderPricing(lines);

      for (const line of lines) {
        const updated = await tx.productVariant.updateMany({
          where: { id: line.variant.id, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count !== 1) {
          throw new OrderError(
            `${line.variant.product.nameFr} is out of stock`,
            "OUT_OF_STOCK",
            409,
          );
        }
      }

      const phone = normalizeTunisianPhone(input.phone);
      if (!phone) {
        throw new OrderError("Invalid Tunisian phone", "INVALID_INPUT");
      }

      const order = await tx.order.create({
        data: {
          orderNumber: orderNumber(),
          accessTokenHash: hashAccessToken(accessToken),
          idempotencyKey: input.idempotencyKey,
          userId,
          customerFirstName: input.customerFirstName,
          customerLastName: input.customerLastName,
          customerEmail: input.customerEmail || null,
          phone,
          governorate: input.governorate,
          city: input.city,
          postalCode: input.postalCode,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 || null,
          deliveryInstructions: input.deliveryInstructions || null,
          customerNotes: input.customerNotes || null,
          ...pricing,
          source: attribution.source,
          medium: attribution.medium,
          campaign: attribution.campaign,
          campaignId: attribution.campaignId,
          adId: attribution.adId,
          adSetId: attribution.adSetId,
          referrer: attribution.referrer,
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
          utmTerm: attribution.utmTerm,
          utmContent: attribution.utmContent,
          landingPage: attribution.landingPage,
          items: {
            create: lines.map((line) => ({
              productId: line.variant.product.id,
              productVariantId: line.variant.id,
              productNameFr: line.variant.product.nameFr,
              productNameEn: line.variant.product.nameEn,
              productSlugFr: line.variant.product.slugFr,
              productSlugEn: line.variant.product.slugEn,
              sku: line.variant.sku,
              variantLabelFr: line.variant.labelFr,
              variantLabelEn: line.variant.labelEn,
              quantity: line.quantity,
              unitPriceMillimes: line.unitPriceMillimes,
              lineTotalMillimes: line.unitPriceMillimes * line.quantity,
              imageUrl: line.variant.product.images[0]?.url,
            })),
          },
          statusHistory: {
            create: {
              toStatus: OrderStatus.PENDING,
              note: "Order placed by customer",
            },
          },
        },
      });

      await tx.inventoryMovement.createMany({
        data: lines.map((line) => ({
          productVariantId: line.variant.id,
          orderId: order.id,
          delta: -line.quantity,
          reason: InventoryReason.ORDER_PLACED,
          note: order.orderNumber,
        })),
      });
      await tx.analyticsEvent.create({
        data: {
          eventType: AnalyticsEventType.ORDER_PLACED,
          eventId: `order:${order.id}`,
          userId,
          orderId: order.id,
          metadata: {
            totalMillimes: order.totalMillimes,
            source: order.source,
          },
        },
      });
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        accessToken,
        reused: false,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function getOrderByAccessToken(token: string) {
  return db.order.findUnique({
    where: { accessTokenHash: hashAccessToken(token) },
    include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
  });
}

export async function transitionOrder(
  orderId: string,
  toStatus: OrderStatus,
  actorUserId: string,
  note?: string,
) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new OrderError("Order not found", "NOT_FOUND", 404);
    if (!canTransitionOrder(order.status, toStatus)) {
      throw new OrderError(
        `Cannot move ${order.status} to ${toStatus}`,
        "INVALID_TRANSITION",
      );
    }

    const restock =
      transitionRestocks(order.status, toStatus) && !order.restockedAt;
    if (restock) {
      for (const item of order.items) {
        if (!item.productVariantId) continue;
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            productVariantId: item.productVariantId,
            orderId: order.id,
            actorUserId,
            delta: item.quantity,
            reason:
              toStatus === OrderStatus.RETURNED
                ? InventoryReason.ORDER_RETURNED
                : InventoryReason.ORDER_CANCELLED,
            note: note || order.orderNumber,
          },
        });
      }
    }

    const paymentStatus =
      toStatus === OrderStatus.DELIVERED
        ? PaymentStatus.PAID
        : toStatus === OrderStatus.RETURNED
          ? PaymentStatus.REFUNDED
          : order.paymentStatus;

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: toStatus,
        paymentStatus,
        ...(restock ? { restockedAt: new Date() } : {}),
      },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus,
        actorUserId,
        note: note?.slice(0, 500),
      },
    });
    return updated;
  });
}
