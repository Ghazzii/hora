import { describe, expect, it } from "vitest";
import {
  isTunisianPhone,
  normalizeTunisianPhone,
} from "@/lib/phone";

describe("Tunisian phone validation", () => {
  it.each([
    ["22 111 222", "+21622111222"],
    ["+216 71 123 456", "+21671123456"],
    ["00216 55 222 333", "+21655222333"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeTunisianPhone(input)).toBe(expected);
  });

  it("rejects invalid numbers", () => {
    expect(isTunisianPhone("123")).toBe(false);
    expect(isTunisianPhone("+33123456789")).toBe(false);
  });
});
