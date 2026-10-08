import { describe, expect, it } from "vitest";
import type { Order, OrderItem } from "@prisma/client";
import { orderSheetRange, orderSheetRow, ORDER_SHEET_HEADERS } from "./order-sheet-row";

describe("order export data", () => {
  it("preserves phone and postal text and converts millimes to TND", () => {
    const order = {
      id: "order-1", orderNumber: "HORA-1", createdAt: new Date("2026-10-08T08:00:00Z"),
      customerFirstName: "Test", customerLastName: "Customer", phone: "+21622555666", postalCode: "0200",
      subtotalMillimes: 329000, deliveryFeeMillimes: 8000, totalMillimes: 337000,
      items: [{ sku: "WATCH-1", productNameFr: "Atlas", variantLabelFr: "Or", quantity: 2 }],
    } as Order & { items: OrderItem[] };
    const row = orderSheetRow(order);
    expect(row).toHaveLength(ORDER_SHEET_HEADERS.length);
    expect(row[5]).toBe("+21622555666");
    expect(row[9]).toBe("0200");
    expect(row.slice(15, 18)).toEqual([329, 8, 337]);
    expect(row[14]).toContain("x2");
    expect(row[6]).toBe("");
  });
  it("escapes sheet names and reserves row one for headers", () => {
    expect(orderSheetRange("Hora's orders", 1)).toBe("'Hora''s orders'!A2:T2");
    expect(() => orderSheetRange("Orders", 0)).toThrow();
  });
});
