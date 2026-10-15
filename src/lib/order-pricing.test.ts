import { describe, expect, it } from "vitest";
import { calculateOrderPricing } from "@/lib/order-pricing";

describe("server order pricing", () => {
  it("recalculates item totals, with free delivery from 100 DT", () => {
    expect(
      calculateOrderPricing([
        { unitPriceMillimes: 100000, quantity: 2 },
        { unitPriceMillimes: 50000, quantity: 1 },
      ]),
    ).toEqual({
      subtotalMillimes: 250000,
      deliveryFeeMillimes: 0,
      totalMillimes: 250000,
    });
  });

  it("charges 8 DT delivery below 100 DT", () => {
    expect(
      calculateOrderPricing([{ unitPriceMillimes: 45000, quantity: 2 }]),
    ).toEqual({
      subtotalMillimes: 90000,
      deliveryFeeMillimes: 8000,
      totalMillimes: 98000,
    });
  });

  it("rejects invalid quantities", () => {
    expect(() =>
      calculateOrderPricing([{ unitPriceMillimes: 1000, quantity: 0 }]),
    ).toThrow();
  });
});
