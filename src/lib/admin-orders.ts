import { OrderStatus, type Prisma } from "@prisma/client";

/** The one-click "next step" offered for each active status. */
export const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  PENDING: { to: OrderStatus.CONFIRMED, label: "Confirm" },
  CONFIRMED: { to: OrderStatus.PREPARING, label: "Start preparing" },
  PREPARING: { to: OrderStatus.SHIPPED, label: "Mark shipped" },
  SHIPPED: { to: OrderStatus.DELIVERED, label: "Mark delivered" },
};

export type OrderFilters = { q?: string; status?: string; source?: string; from?: string; to?: string };

function validDate(value: string | undefined) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

/** Builds the order query shared by the admin list and its CSV export. */
export function orderWhere(filters: OrderFilters, options: { includeStatus?: boolean } = {}): Prisma.OrderWhereInput {
  const q = filters.q?.trim().slice(0, 100);
  const digits = q?.replace(/\D/g, "") ?? "";
  const from = validDate(filters.from);
  const to = validDate(filters.to);
  const status = filters.status && Object.values(OrderStatus).includes(filters.status as OrderStatus) ? (filters.status as OrderStatus) : undefined;
  return {
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { customerFirstName: { contains: q, mode: "insensitive" } },
            { customerLastName: { contains: q, mode: "insensitive" } },
            { customerEmail: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
            // Phones are stored as +216XXXXXXXX; match on the national digits however they were typed.
            ...(digits.length >= 4 ? [{ phone: { contains: digits.slice(-8) } }] : []),
          ],
        }
      : {}),
    ...(options.includeStatus !== false && status ? { status } : {}),
    ...(filters.source ? { source: filters.source === "direct" ? null : filters.source } : {}),
    ...(from || to
      ? {
          createdAt: {
            // Dates are interpreted in Tunis time (UTC+1, no DST).
            ...(from ? { gte: new Date(`${from}T00:00:00+01:00`) } : {}),
            ...(to ? { lt: new Date(new Date(`${to}T00:00:00+01:00`).getTime() + 86_400_000) } : {}),
          },
        }
      : {}),
  };
}
