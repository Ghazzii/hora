import { describe, expect, it } from "vitest";
import { addDeliveryFee, formatTnd } from "@/lib/money";

describe("Tunisian money", () => {
  it("formats integer millimes", () => {
    expect(formatTnd(329000, "fr")).toContain("329");
    expect(formatTnd(329500, "en")).toContain("329.500");
  });

  it("always adds the fixed 8 DT delivery fee", () => {
    expect(addDeliveryFee(100000)).toBe(108000);
  });

  it("rejects fractional millimes", () => {
    expect(() => formatTnd(1.2)).toThrow();
  });
});
