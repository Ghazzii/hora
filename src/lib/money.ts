import { DELIVERY_FEE_MILLIMES, FREE_DELIVERY_THRESHOLD_MILLIMES } from "@/lib/constants";

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

/** Delivery costs DELIVERY_FEE_MILLIMES, and nothing once the items reach FREE_DELIVERY_THRESHOLD_MILLIMES. */
export function deliveryFeeFor(subtotalMillimes: number): number {
  if (!Number.isInteger(subtotalMillimes) || subtotalMillimes < 0) {
    throw new RangeError("Subtotal must be a non-negative integer");
  }
  return subtotalMillimes >= FREE_DELIVERY_THRESHOLD_MILLIMES ? 0 : DELIVERY_FEE_MILLIMES;
}

export function addDeliveryFee(subtotalMillimes: number): number {
  return subtotalMillimes + deliveryFeeFor(subtotalMillimes);
}
