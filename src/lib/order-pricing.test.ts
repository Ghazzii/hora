import { describe, expect, it } from "vitest";
import { calculateOrderPricing } from "@/lib/order-pricing";

describe("server order pricing", () => {
  it("recalculates item totals and delivery", () => {
    expect(
      calculateOrderPricing([
        { unitPriceMillimes: 100000, quantity: 2 },
        { unitPriceMillimes: 50000, quantity: 1 },
      ]),
    ).toEqual({
      subtotalMillimes: 250000,
      deliveryFeeMillimes: 8000,
      totalMillimes: 258000,
    });
  });

  it("rejects invalid quantities", () => {
    expect(() =>
      calculateOrderPricing([{ unitPriceMillimes: 1000, quantity: 0 }]),
    ).toThrow();
  });
});
