import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validation";
import { TUNISIAN_GOVERNORATES } from "@/lib/constants";
import { TUNISIAN_CITIES } from "@/lib/tunisia-cities";

const valid = {
  idempotencyKey: "1234567890abcdef",
  locale: "fr",
  customerFirstName: "Amira",
  customerLastName: "Ben Salem",
  customerEmail: "amira@example.com",
  phone: "+21622111222",
  governorate: "Tunis",
  city: "La Marsa",
  postalCode: "2070",
  addressLine1: "12 avenue Habib Bourguiba",
  codAccepted: true,
  items: [{ variantId: "3f5de188-95da-45d0-8238-b89f8b9a536f", quantity: 1 }],
} as const;

describe("checkout schema", () => {
  it("accepts a complete COD checkout", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an unknown governorate and missing consent", () => {
    expect(
      checkoutSchema.safeParse({
        ...valid,
        governorate: "Paris",
        codAccepted: false,
      }).success,
    ).toBe(false);
  });

  it("makes the postal code optional but still checks one that is given", () => {
    expect(checkoutSchema.parse({ ...valid, postalCode: undefined }).postalCode).toBe("");
    expect(checkoutSchema.parse({ ...valid, postalCode: "  " }).postalCode).toBe("");
    expect(checkoutSchema.safeParse({ ...valid, postalCode: "207" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, postalCode: "20a0" }).success).toBe(false);
  });
});

describe("checkout city lists", () => {
  it("lists cities for exactly the 24 governorates, sorted and without duplicates", () => {
    expect(Object.keys(TUNISIAN_CITIES).sort()).toEqual([...TUNISIAN_GOVERNORATES].sort());
    for (const [governorate, cities] of Object.entries(TUNISIAN_CITIES)) {
      expect(cities.length, governorate).toBeGreaterThan(3);
      expect(new Set(cities).size, governorate).toBe(cities.length);
      expect([...cities], governorate).toEqual([...cities].sort((a, b) => a.localeCompare(b, "fr")));
    }
  });
});
