import { AnalyticsEventType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type {
  EcommerceEventName,
  EcommerceEventPayload,
} from "@/lib/analytics/types";

const eventMap: Record<EcommerceEventName, AnalyticsEventType> = {
  ViewContent: AnalyticsEventType.VIEW_CONTENT,
  Search: AnalyticsEventType.SEARCH,
  AddToCart: AnalyticsEventType.ADD_TO_CART,
  InitiateCheckout: AnalyticsEventType.INITIATE_CHECKOUT,
  OrderPlaced: AnalyticsEventType.ORDER_PLACED,
};

export async function recordFirstPartyEvent(
  name: EcommerceEventName,
  payload: EcommerceEventPayload,
  context: {
    anonymousId?: string;
    sessionId?: string;
    userId?: string;
  } = {},
) {
  const eventId =
    typeof payload.eventId === "string" ? payload.eventId.slice(0, 100) : crypto.randomUUID();
  await db.analyticsEvent.upsert({
    where: { eventId },
    update: {},
    create: {
      eventId,
      eventType: eventMap[name],
      anonymousId: context.anonymousId?.slice(0, 100),
      sessionId: context.sessionId?.slice(0, 100),
      userId: context.userId,
      orderId:
        typeof payload.orderId === "string" ? payload.orderId : undefined,
      metadata: payload as Prisma.InputJsonValue,
    },
  });
}

export async function sendMetaConversionApiEvent(
  _name: EcommerceEventName,
  _payload: EcommerceEventPayload,
) {
  if (!process.env.META_PIXEL_ID || !process.env.META_ACCESS_TOKEN) {
    return { sent: false as const, reason: "disabled" as const };
  }
  // Intentionally disabled until consent, identifier hashing, retry storage,
  // and Meta data-processing terms are reviewed. See docs/META_INTEGRATION.md.
  return { sent: false as const, reason: "not-configured" as const };
}
