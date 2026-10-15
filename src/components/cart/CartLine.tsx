"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { CartItem } from "@/types/cart";
import { MAX_CART_QUANTITY } from "@/lib/constants";
import { formatTnd } from "@/lib/money";
import { useCart } from "@/providers/CartProvider";
import { cn, optionLabel } from "@/lib/utils";

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  locale,
  size = "md",
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  locale: Locale;
  size?: "sm" | "md";
}) {
  const french = locale === "fr";
  const button = cn(
    "grid place-items-center rounded-full text-ink/70 transition hover:bg-ink/[.06] hover:text-ink active:scale-90 disabled:opacity-25",
    size === "sm" ? "h-8 w-8" : "h-10 w-10",
  );
  return (
    <div className="inline-flex items-center rounded-full border border-ink/15 bg-white p-0.5" role="group" aria-label={label}>
      <button type="button" className={button} disabled={value <= 1} onClick={() => onChange(value - 1)} aria-label={french ? "Diminuer" : "Decrease"}>
        <Minus size={14} />
      </button>
      <span className={cn("text-center font-semibold tabular-nums", size === "sm" ? "min-w-7 text-sm" : "min-w-9")} aria-live="polite">{value}</span>
      <button type="button" className={button} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={french ? "Augmenter" : "Increase"}>
        <Plus size={14} />
      </button>
    </div>
  );
}

export function CartLine({ item, locale, compact = false, onNavigate }: { item: CartItem; locale: Locale; compact?: boolean; onNavigate?: () => void }) {
  const cart = useCart();
  const french = locale === "fr";
  const name = french ? item.productNameFr : item.productNameEn;
  const href = `/${locale}/montres/${french ? item.productSlugFr : item.productSlugEn}`;
  return (
    <article className={cn("group grid gap-4 animate-fade-in", compact ? "grid-cols-[84px_1fr] py-4" : "grid-cols-[96px_1fr] py-6 sm:grid-cols-[128px_1fr]")}>
      <Link href={href} onClick={onNavigate} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand" tabIndex={-1}>
        <Image src={item.imageUrl} alt="" fill className="object-cover transition duration-700 ease-out group-hover:scale-105" sizes="128px" />
      </Link>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={href} onClick={onNavigate} className={cn("block truncate font-display font-medium leading-tight hover:text-gold-dark", compact ? "text-xl" : "text-2xl")}>{name}</Link>
            {optionLabel(french ? item.variantLabelFr : item.variantLabelEn) && <p className="mt-1 text-xs text-ink/55">{optionLabel(french ? item.variantLabelFr : item.variantLabelEn)}</p>}
          </div>
          <button
            type="button"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/40 transition hover:bg-red-50 hover:text-red-700"
            onClick={() => cart.removeItem(item.variantId)}
            aria-label={french ? `Retirer ${name}` : `Remove ${name}`}
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <QuantityStepper
            size={compact ? "sm" : "md"}
            locale={locale}
            value={item.quantity}
            max={Math.min(MAX_CART_QUANTITY, item.maxStock)}
            onChange={(quantity) => cart.setQuantity(item.variantId, quantity)}
            label={french ? `Quantité de ${name}` : `Quantity of ${name}`}
          />
          <div className="text-right">
            <p className="font-semibold tabular-nums">{formatTnd(item.unitPriceMillimes * item.quantity, locale)}</p>
            {item.quantity > 1 && <p className="text-[11px] text-ink/45">{formatTnd(item.unitPriceMillimes, locale)} / {french ? "unité" : "each"}</p>}
          </div>
        </div>
      </div>
    </article>
  );
}
