import { describe, expect, it } from "vitest";
import { catalogVariantWhere } from "@/lib/catalog-filters";

describe("catalogVariantWhere", () => {
  it("applies minimum and maximum price to the same stocked variant", () => {
    expect(catalogVariantWhere({ minPrice: 100_000, maxPrice: 250_000, available: true })).toEqual({
      active: true,
      priceMillimes: { gte: 100_000, lte: 250_000 },
      stock: { gt: 0 },
    });
  });
});
