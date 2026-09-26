import type { Prisma } from "@prisma/client";

export function catalogVariantWhere(query: {
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
}): Prisma.ProductVariantWhereInput {
  return {
    active: true,
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? { priceMillimes: {
          ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
          ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
        } }
      : {}),
    ...(query.available ? { stock: { gt: 0 } } : {}),
  };
}
