"use client";

import Link from "next/link";
import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { useCart } from "@/providers/CartProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";

export function Header({ locale }: { locale: Locale }) {
  const copy = t(locale);
  const { count } = useCart();
  const { productIds } = useWishlist();
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-ivory/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link href={`/${locale}`} className="font-display text-2xl tracking-[.25em] sm:text-3xl">HORA</Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href={`/${locale}/recherche`} className="icon-link" aria-label={copy.nav.search}><Search size={20} /></Link>
          <Link href={`/${locale}/favoris`} className="icon-link relative" aria-label={copy.nav.wishlist}><Heart size={20} />{productIds.length > 0 && <span className="count-badge">{productIds.length}</span>}</Link>
          <Link href={`/${locale}/compte`} className="icon-link hidden sm:grid" aria-label={copy.nav.account}><UserRound size={20} /></Link>
          <Link href={`/${locale}/panier`} className="icon-link relative" aria-label={copy.nav.cart}><ShoppingBag size={20} />{count > 0 && <span className="count-badge">{count}</span>}</Link>
          <LocaleSwitcher locale={locale} />
        </div>
      </div>
    </header>
  );
}
