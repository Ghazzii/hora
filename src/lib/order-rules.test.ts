import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  canTransitionOrder,
  transitionRestocks,
} from "@/lib/order-rules";

describe("order workflow", () => {
  it("allows the normal COD lifecycle", () => {
    expect(canTransitionOrder(OrderStatus.PENDING, OrderStatus.CONFIRMED)).toBe(true);
    expect(canTransitionOrder(OrderStatus.CONFIRMED, OrderStatus.PREPARING)).toBe(true);
    expect(canTransitionOrder(OrderStatus.PREPARING, OrderStatus.SHIPPED)).toBe(true);
    expect(canTransitionOrder(OrderStatus.SHIPPED, OrderStatus.DELIVERED)).toBe(true);
  });

  it("rejects skipped and terminal transitions", () => {
    expect(canTransitionOrder(OrderStatus.PENDING, OrderStatus.SHIPPED)).toBe(false);
    expect(canTransitionOrder(OrderStatus.CANCELLED, OrderStatus.CONFIRMED)).toBe(false);
  });

  it("restocks cancellation and delivered returns", () => {
    expect(transitionRestocks(OrderStatus.CONFIRMED, OrderStatus.CANCELLED)).toBe(true);
    expect(transitionRestocks(OrderStatus.DELIVERED, OrderStatus.RETURNED)).toBe(true);
    expect(transitionRestocks(OrderStatus.SHIPPED, OrderStatus.DELIVERED)).toBe(false);
  });
});
