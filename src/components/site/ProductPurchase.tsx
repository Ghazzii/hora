"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { formatTnd } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/providers/CartProvider";

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
  const firstAvailable = variants.find((variant) => variant.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const cart = useCart();
  const selected = useMemo(
    () => variants.find((variant) => variant.id === variantId),
    [variantId, variants],
  );

  if (!selected) return null;
  const available = selected.stock > 0;
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="label">{locale === "fr" ? "Bracelet" : "Strap"}</legend>
        <div className="mt-2 grid gap-2">
          {variants.map((variant) => (
            <label
              key={variant.id}
              className="flex cursor-pointer items-center justify-between border border-black/15 p-3 has-[:checked]:border-gold has-[:checked]:bg-gold/5"
            >
              <span>
                <input
                  type="radio"
                  name="variant"
                  value={variant.id}
                  checked={variant.id === variantId}
                  onChange={() => {
                    setVariantId(variant.id);
                    setQuantity(1);
                  }}
                  className="mr-3 accent-black"
                />
                {locale === "fr" ? variant.labelFr : variant.labelEn}
              </span>
              <span className="font-semibold">{formatTnd(variant.priceMillimes, locale)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="quantity" className="label">{locale === "fr" ? "Quantité" : "Quantity"}</label>
        <select
          id="quantity"
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className="field mt-2 w-24"
          disabled={!available}
        >
          {Array.from({ length: Math.min(10, selected.stock) }, (_, index) => index + 1).map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <Button
        size="lg"
        className="w-full"
        disabled={!available}
        onClick={() => {
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
          setTimeout(() => setAdded(false), 2200);
        }}
      >
        {!available
          ? locale === "fr" ? "Rupture de stock" : "Out of stock"
          : added
            ? locale === "fr" ? "Ajoutée au panier" : "Added to cart"
            : locale === "fr" ? "Ajouter au panier" : "Add to cart"}
      </Button>
      <p className="text-center text-xs leading-5 text-black/60">
        {locale === "fr"
          ? "Paiement uniquement à la livraison, après confirmation par téléphone."
          : "Payment only on delivery, after confirmation by phone."}
      </p>
    </div>
  );
}
