import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import type { CheckoutInput } from "./validation";

const mock = vi.hoisted(() => ({ findUnique: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { order: { findUnique: mock.findUnique }, $transaction: mock.transaction } }));
vi.mock("@/lib/env", () => ({ serverEnv: () => ({ SESSION_SECRET: "test-only-secret-longer-than-thirty-two-characters" }) }));
import { createOrder } from "./orders";

const input: CheckoutInput = {
  idempotencyKey: "test-idempotency-key-1234", locale: "fr",
  customerFirstName: "Amira", customerLastName: "Ben Salem", customerEmail: "amira@example.com",
  phone: "+21622111222", governorate: "Tunis", city: "La Marsa", postalCode: "2070",
  addressLine1: "12 avenue Habib Bourguiba", codAccepted: true,
  items: [{ variantId: "3f5de188-95da-45d0-8238-b89f8b9a536f", quantity: 1 }],
};

describe("checkout persistence", () => {
  beforeEach(() => { vi.resetAllMocks(); mock.findUnique.mockResolvedValue(null); });

  it("creates the Sheet export inside the same serializable transaction as the order", async () => {
    const job = vi.fn().mockResolvedValue({});
    const order = {
      id: "order-1", orderNumber: "HORA-1", createdAt: new Date(),
      ...input, subtotalMillimes: 100000, deliveryFeeMillimes: 8000, totalMillimes: 108000,
      items: [{ sku: "WATCH-1", productNameFr: "Atlas", variantLabelFr: "Standard", quantity: 1 }],
    };
    const tx = {
      productVariant: { findMany: vi.fn().mockResolvedValue([{
        id: input.items[0]!.variantId, sku: "WATCH-1", priceMillimes: 100000, stock: 10,
        product: { id: "product-1", nameFr: "Atlas", nameEn: "Atlas", slugFr: "atlas", slugEn: "atlas", images: [] },
      }]), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      order: { create: vi.fn().mockResolvedValue(order) },
      orderSheetExport: { create: job }, inventoryMovement: { createMany: vi.fn() },
      analyticsEvent: { create: vi.fn() },
    };
    mock.transaction.mockImplementation(async (work) => work(tx));
    expect(await createOrder(input, {})).toMatchObject({ orderId: "order-1", reused: false });
    expect(job).toHaveBeenCalledWith({ data: { orderId: "order-1", values: expect.arrayContaining(["Amira", "+21622111222", 108]) } });
    expect(mock.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  });

  it("rechecks idempotency after a transaction conflict and returns the committed order", async () => {
    mock.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "saved-order", orderNumber: "HORA-SAVED" });
    mock.transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Conflict", { code: "P2034", clientVersion: "6.19.0" }));
    expect(await createOrder(input, {})).toMatchObject({ orderId: "saved-order", reused: true });
    expect(mock.transaction).toHaveBeenCalledTimes(1);
  });

  it("bounds retries and propagates persistent conflicts", async () => {
    mock.transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Conflict", { code: "P2034", clientVersion: "6.19.0" }));
    await expect(createOrder(input, {})).rejects.toMatchObject({ code: "P2034" });
    expect(mock.transaction).toHaveBeenCalledTimes(3);
  });
});
