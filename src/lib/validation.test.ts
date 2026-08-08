import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validation";

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
});
