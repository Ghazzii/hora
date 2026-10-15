import { Truck } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { FREE_DELIVERY_THRESHOLD_MILLIMES } from "@/lib/constants";
import { deliveryFeeFor, formatTnd } from "@/lib/money";

/** The delivery line's amount: "Offerte" once the cart qualifies, otherwise the fee. */
export function DeliveryFee({ subtotalMillimes, locale }: { subtotalMillimes: number; locale: Locale }) {
  const fee = deliveryFeeFor(subtotalMillimes);
  if (fee) return <>{formatTnd(fee, locale)}</>;
  return <span className="font-semibold text-emerald-700">{locale === "fr" ? "Offerte" : "Free"}</span>;
}

/** Tells shoppers how far they are from free delivery, or that they already have it. */
export function FreeDeliveryProgress({ subtotalMillimes, locale }: { subtotalMillimes: number; locale: Locale }) {
  const french = locale === "fr";
  const missing = FREE_DELIVERY_THRESHOLD_MILLIMES - subtotalMillimes;
  const reached = missing <= 0;
  return (
    <div className="rounded-2xl bg-ivory px-4 py-3 text-xs">
      <p className="flex items-center gap-2 font-medium text-ink/75">
        <Truck size={14} className={reached ? "text-emerald-700" : "text-gold-dark"} />
        {reached
          ? french ? "Livraison offerte sur cette commande." : "Delivery is free on this order."
          : french ? <>Plus que <strong className="text-ink">{formatTnd(missing, locale)}</strong> pour la livraison offerte.</> : <>Only <strong className="text-ink">{formatTnd(missing, locale)}</strong> away from free delivery.</>}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
        <div className={reached ? "h-full bg-emerald-600" : "h-full bg-gold"} style={{ width: `${Math.min(100, (subtotalMillimes / FREE_DELIVERY_THRESHOLD_MILLIMES) * 100)}%` }} />
      </div>
    </div>
  );
}
