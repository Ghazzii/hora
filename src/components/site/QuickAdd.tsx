"use client";

import Link from "next/link";
import { Plus, ShoppingBag } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useCart } from "@/providers/CartProvider";

export type QuickAddProduct = {
  id: string;
  slugFr: string;
  slugEn: string;
  nameFr: string;
  nameEn: string;
  imageUrl: string;
  variants: { id: string; labelFr: string; labelEn: string; priceMillimes: number; stock: number }[];
};

/** Adds single-variant watches straight to the cart; otherwise links to the product to choose. */
export function QuickAdd({ product, locale }: { product: QuickAddProduct; locale: Locale }) {
  const cart = useCart();
  const french = locale === "fr";
  const inStock = product.variants.filter((variant) => variant.stock > 0);
  if (!inStock.length) return null;
  const name = french ? product.nameFr : product.nameEn;
  const className = "flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink/90 text-xs font-bold uppercase tracking-[.14em] text-white backdrop-blur transition hover:bg-ink";
  const mobileClass = "grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-soft transition active:scale-90";

  if (product.variants.length > 1) {
    const href = `/${locale}/montres/${french ? product.slugFr : product.slugEn}`;
    return (
      <>
        <Link href={href} className={`${className} hidden md:flex`} tabIndex={-1}>{french ? "Choisir une option" : "Choose an option"}</Link>
        <Link href={href} className={`${mobileClass} md:hidden`} aria-label={french ? `Choisir une option pour ${name}` : `Choose an option for ${name}`}><Plus size={18} /></Link>
      </>
    );
  }

  const variant = inStock[0]!;
  const add = () => {
    cart.addItem({
      productId: product.id,
      variantId: variant.id,
      productSlugFr: product.slugFr,
      productSlugEn: product.slugEn,
      productNameFr: product.nameFr,
      productNameEn: product.nameEn,
      variantLabelFr: variant.labelFr,
      variantLabelEn: variant.labelEn,
      imageUrl: product.imageUrl,
      unitPriceMillimes: variant.priceMillimes,
      maxStock: variant.stock,
    });
    cart.openDrawer();
  };
  return (
    <>
      <button type="button" onClick={add} className={`${className} hidden md:flex`} aria-label={french ? `Ajouter ${name} au panier` : `Add ${name} to cart`}>
        <ShoppingBag size={14} /> {french ? "Ajout rapide" : "Quick add"}
      </button>
      <button type="button" onClick={add} className={`${mobileClass} md:hidden`} aria-label={french ? `Ajouter ${name} au panier` : `Add ${name} to cart`}>
        <ShoppingBag size={17} />
      </button>
    </>
  );
}
