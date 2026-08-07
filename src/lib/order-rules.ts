import { OrderStatus } from "@prisma/client";

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [OrderStatus.RETURNED],
  CANCELLED: [],
  RETURNED: [],
};

export function canTransitionOrder(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function transitionRestocks(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return (
    to === OrderStatus.CANCELLED ||
    (from === OrderStatus.DELIVERED && to === OrderStatus.RETURNED)
  );
}

export function statusLabel(status: OrderStatus, locale: "fr" | "en") {
  const labels: Record<OrderStatus, { fr: string; en: string }> = {
    PENDING: { fr: "En attente", en: "Pending" },
    CONFIRMED: { fr: "Confirmée", en: "Confirmed" },
    PREPARING: { fr: "En préparation", en: "Preparing" },
    SHIPPED: { fr: "Expédiée", en: "Shipped" },
    DELIVERED: { fr: "Livrée", en: "Delivered" },
    CANCELLED: { fr: "Annulée", en: "Cancelled" },
    RETURNED: { fr: "Retournée", en: "Returned" },
  };
  return labels[status][locale];
}
