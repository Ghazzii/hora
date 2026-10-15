"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Banknote, Check, PhoneCall, ShoppingBag, Truck } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { MAX_CART_QUANTITY } from "@/lib/constants";
import { formatTnd } from "@/lib/money";
import { useCart } from "@/providers/CartProvider";
import { QuantityStepper } from "@/components/cart/CartLine";
import { WishlistButton } from "@/components/site/WishlistButton";
import { cn } from "@/lib/utils";

type Variant = {
  id: string;
  sku: string;
  labelFr: string;
  labelEn: string;
  priceMillimes: number;
  compareAtPriceMillimes: number | null;
  stock: number;
};

export function ProductPurchase({
  locale,
  product,
  variants,
}: {
  locale: Locale;
  product: {
    id: string;
    slugFr: string;
    slugEn: string;
    nameFr: string;
    nameEn: string;
    imageUrl: string;
  };
  variants: Variant[];
}) {
  const french = locale === "fr";
  const firstAvailable = variants.find((variant) => variant.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cart = useCart();
  const selected = useMemo(() => variants.find((variant) => variant.id === variantId), [variantId, variants]);

  useEffect(() => {
    setMounted(true);
    const node = buttonRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setShowBar(!entry?.isIntersecting && (entry?.boundingClientRect.top ?? 0) < 0));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 2200);
    return () => window.clearTimeout(timer);
  }, [added]);

  if (!selected) return null;
  const available = selected.stock > 0;
  const lowStock = available && selected.stock <= 3;
  const onSale = Boolean(selected.compareAtPriceMillimes && selected.compareAtPriceMillimes > selected.priceMillimes);
  const name = french ? product.nameFr : product.nameEn;

  const add = () => {
    cart.addItem(
      {
        productId: product.id,
        variantId: selected.id,
        productSlugFr: product.slugFr,
        productSlugEn: product.slugEn,
        productNameFr: product.nameFr,
        productNameEn: product.nameEn,
        variantLabelFr: selected.labelFr,
        variantLabelEn: selected.labelEn,
        imageUrl: product.imageUrl,
        unitPriceMillimes: selected.priceMillimes,
        maxStock: selected.stock,
      },
      quantity,
    );
    setAdded(true);
    cart.openDrawer();
  };

  const buttonLabel = !available
    ? french ? "Rupture de stock" : "Out of stock"
    : added
      ? french ? "Ajoutée au panier" : "Added to cart"
      : french ? "Ajouter au panier" : "Add to cart";

  return (
    <div className="space-y-7">
      <div aria-live="polite">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-4xl font-medium tabular-nums">{formatTnd(selected.priceMillimes, locale)}</span>
          {onSale && (
            <>
              <span className="text-base text-ink/40 line-through tabular-nums">{formatTnd(selected.compareAtPriceMillimes!, locale)}</span>
              <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs font-bold text-gold-dark">
                {french ? "Économisez" : "Save"} {formatTnd(selected.compareAtPriceMillimes! - selected.priceMillimes, locale)}
              </span>
            </>
          )}
        </p>
        <p className={cn("mt-3 flex items-center gap-2 text-sm font-medium", available ? (lowStock ? "text-gold-dark" : "text-emerald-800") : "text-red-700")}>
          <span className="relative flex h-2 w-2">
            {available && <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", lowStock ? "bg-gold" : "bg-emerald-500")} />}
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", available ? (lowStock ? "bg-gold" : "bg-emerald-600") : "bg-red-600")} />
          </span>
          {!available
            ? french ? "Rupture de stock" : "Out of stock"
            : lowStock
              ? french ? `Plus que ${selected.stock} en stock` : `Only ${selected.stock} left`
              : french ? "En stock — prête à être expédiée" : "In stock — ready to ship"}
        </p>
      </div>

      {variants.length > 1 && (
        <fieldset>
          <legend className="label">{french ? "Bracelet" : "Strap"} · <span className="normal-case tracking-normal text-ink">{french ? selected.labelFr : selected.labelEn}</span></legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {variants.map((variant) => (
              <label key={variant.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="variant"
                  value={variant.id}
                  checked={variant.id === variantId}
                  onChange={() => {
                    setVariantId(variant.id);
                    setQuantity(1);
                  }}
                  className="peer sr-only"
                />
                <span className="flex items-center justify-between gap-3 rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm transition hover:border-ink/40 peer-checked:border-ink peer-checked:shadow-[inset_0_0_0_1px_#0b0b0a] peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                  <span className={cn("font-medium", variant.stock <= 0 && "text-ink/40 line-through")}>{french ? variant.labelFr : variant.labelEn}</span>
                  <span className="text-right text-xs tabular-nums text-ink/60">
                    {variant.stock <= 0 ? (french ? "Épuisé" : "Sold out") : formatTnd(variant.priceMillimes, locale)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-stretch gap-3">
        {available && (
          <QuantityStepper locale={locale} value={quantity} max={Math.min(MAX_CART_QUANTITY, selected.stock)} onChange={setQuantity} label={french ? "Quantité" : "Quantity"} />
        )}
        <button ref={buttonRef} type="button" className="btn-primary h-[52px] flex-1" disabled={!available} onClick={add}>
          {added ? <Check size={18} className="animate-scale-in" /> : <ShoppingBag size={17} />} {buttonLabel}
        </button>
        <WishlistButton productId={product.id} size="lg" label={french ? `Ajouter ${name} aux favoris` : `Add ${name} to wishlist`} className="h-[52px] w-[52px] border border-ink/15 shadow-none" />
      </div>

      <ul className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white/60 text-sm">
        {[
          { icon: Truck, text: french ? "Livraison offerte dès 100 DT, partout en Tunisie" : "Free delivery from 100 DT, anywhere in Tunisia" },
          { icon: PhoneCall, text: french ? "Nous vous appelons pour confirmer la commande" : "We call you to confirm the order" },
          { icon: Banknote, text: french ? "Paiement uniquement à la livraison" : "Payment only on delivery" },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 px-4 py-3.5 text-ink/75"><Icon size={17} className="shrink-0 text-gold-dark" strokeWidth={1.7} /> {text}</li>
        ))}
      </ul>
      <Link href={`/${locale}/livraison-retours`} className="link-underline text-xs text-ink/60">{french ? "Livraison & retours" : "Delivery & returns"}</Link>

      {/* Sticky buy bar once the main button scrolls away (mobile & tablet). Portalled so animated ancestors cannot trap it. */}
      {mounted && createPortal(<div
        aria-hidden={!showBar}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-ivory/95 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-500 ease-out lg:hidden",
          showBar ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
      >
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg leading-tight">{name}</p>
            <p className="text-sm font-semibold tabular-nums">{formatTnd(selected.priceMillimes, locale)}</p>
          </div>
          <button type="button" tabIndex={showBar ? 0 : -1} className="btn-primary h-11 px-5" disabled={!available} onClick={add}>
            <ShoppingBag size={16} /> {available ? (french ? "Ajouter" : "Add") : french ? "Épuisée" : "Sold out"}
          </button>
        </div>
      </div>, document.body)}
    </div>
  );
}
