"use client";

import Link from "next/link";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { useCart } from "@/providers/CartProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";

export function Header({ locale }: { locale: Locale }) {
  const copy = t(locale);
  const { count } = useCart();
  const { productIds } = useWishlist();
  const [open, setOpen] = useState(false);
  const links = [
    { href: `/${locale}/montres`, label: copy.nav.watches },
    { href: `/${locale}/a-propos`, label: locale === "fr" ? "La maison" : "Our house" },
    { href: `/${locale}/livraison-retours`, label: locale === "fr" ? "Livraison" : "Delivery" },
  ];

  return (
    <>
      <div className="bg-ink px-4 py-2 text-center text-xs tracking-wide text-white">
        {copy.common.delivery} · 8 DT · {copy.common.cod}
      </div>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-ivory/95 backdrop-blur">
        <div className="container flex h-20 items-center justify-between gap-4">
          <button
            className="p-2 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
          <Link href={`/${locale}`} className="font-display text-3xl tracking-[.22em]">
            HORA
          </Link>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-3">
            <Link href={`/${locale}/recherche`} className="icon-link" aria-label={copy.nav.search}>
              <Search size={20} />
            </Link>
            <Link href={`/${locale}/favoris`} className="icon-link relative" aria-label={copy.nav.wishlist}>
              <Heart size={20} />
              {productIds.length > 0 && <span className="count-badge">{productIds.length}</span>}
            </Link>
            <Link href={`/${locale}/compte`} className="icon-link hidden sm:grid" aria-label={copy.nav.account}>
              <UserRound size={20} />
            </Link>
            <Link href={`/${locale}/panier`} className="icon-link relative" aria-label={copy.nav.cart}>
              <ShoppingBag size={20} />
              {count > 0 && <span className="count-badge">{count}</span>}
            </Link>
            <LocaleSwitcher locale={locale} />
          </div>
        </div>
        {open && (
          <nav className="border-t border-black/10 bg-ivory px-6 py-5 lg:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block border-b border-black/10 py-3 font-semibold"
              >
                {link.label}
              </Link>
            ))}
            <Link href={`/${locale}/compte`} className="block py-3 font-semibold">
              {copy.nav.account}
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
