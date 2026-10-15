import { describe, expect, it } from "vitest";
import { addDeliveryFee, deliveryFeeFor, formatTnd } from "@/lib/money";

describe("Tunisian money", () => {
  it("formats integer millimes", () => {
    expect(formatTnd(329000, "fr")).toContain("329");
    expect(formatTnd(329500, "en")).toContain("329.500");
  });

  it("charges 8 DT delivery below 100 DT and nothing from 100 DT", () => {
    expect(deliveryFeeFor(0)).toBe(8000);
    expect(addDeliveryFee(99999)).toBe(107999);
    expect(addDeliveryFee(100000)).toBe(100000);
    expect(addDeliveryFee(329000)).toBe(329000);
    expect(() => deliveryFeeFor(-1)).toThrow();
  });

  it("rejects fractional millimes", () => {
    expect(() => formatTnd(1.2)).toThrow();
  });
});
