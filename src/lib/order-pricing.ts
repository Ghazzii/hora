import { deliveryFeeFor } from "@/lib/money";

export type PriceLine = {
  unitPriceMillimes: number;
  quantity: number;
};

export function calculateOrderPricing(lines: PriceLine[]) {
  if (lines.length === 0) throw new Error("An order requires at least one item");
  const subtotalMillimes = lines.reduce((total, line) => {
    if (
      !Number.isInteger(line.unitPriceMillimes) ||
      line.unitPriceMillimes < 0 ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1
    ) {
      throw new Error("Invalid price line");
    }
    return total + line.unitPriceMillimes * line.quantity;
  }, 0);
  const deliveryFeeMillimes = deliveryFeeFor(subtotalMillimes);
  return {
    subtotalMillimes,
    deliveryFeeMillimes,
    totalMillimes: subtotalMillimes + deliveryFeeMillimes,
  };
}
