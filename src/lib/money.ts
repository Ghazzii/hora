import { DELIVERY_FEE_MILLIMES } from "@/lib/constants";

export function formatTnd(
  millimes: number,
  locale: "fr" | "en" = "fr",
): string {
  if (!Number.isInteger(millimes)) {
    throw new TypeError("Money must be represented as integer millimes");
  }
  const amount = millimes / 1000;
  const formatted = new Intl.NumberFormat(locale === "fr" ? "fr-TN" : "en-TN", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 3,
    maximumFractionDigits: 3,
  }).format(amount);
  return `${formatted} DT`;
}

export function addDeliveryFee(subtotalMillimes: number): number {
  if (!Number.isInteger(subtotalMillimes) || subtotalMillimes < 0) {
    throw new RangeError("Subtotal must be a non-negative integer");
  }
  return subtotalMillimes + DELIVERY_FEE_MILLIMES;
}
