"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { useCart } from "@/providers/CartProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";

export function Header({ locale }: { locale: Locale }) {
  const copy = t(locale);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useCart();
  const { productIds } = useWishlist();
  const links = [
    { href: `/${locale}/montres`, label: copy.nav.watches },
    { href: `/${locale}/a-propos`, label: locale === "fr" ? "À propos" : "About" },
    { href: `/${locale}/livraison-retours`, label: locale === "fr" ? "Livraison & retours" : "Delivery & returns" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-ivory/95 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link href={`/${locale}`} className="font-display text-2xl tracking-[.25em] sm:text-3xl" aria-label="Hora — home">HORA</Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label={locale === "fr" ? "Navigation principale" : "Main navigation"}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className="nav-link aria-[current=page]:after:w-full">{label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-0.5 sm:gap-2">
          <Link href={`/${locale}/recherche`} className="icon-link" aria-label={copy.nav.search}><Search size={20} /></Link>
          <Link href={`/${locale}/favoris`} className="icon-link relative" aria-label={copy.nav.wishlist}><Heart size={20} />{productIds.length > 0 && <span className="count-badge">{productIds.length}</span>}</Link>
          <Link href={`/${locale}/compte`} className="icon-link hidden sm:grid" aria-label={copy.nav.account}><UserRound size={20} /></Link>
          <Link href={`/${locale}/panier`} className="icon-link relative" aria-label={copy.nav.cart}><ShoppingBag size={20} />{count > 0 && <span className="count-badge">{count}</span>}</Link>
          <LocaleSwitcher locale={locale} />
          <button type="button" className="icon-link lg:hidden" aria-label={menuOpen ? (locale === "fr" ? "Fermer le menu" : "Close menu") : (locale === "fr" ? "Ouvrir le menu" : "Open menu")} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {menuOpen && (
        <nav id="mobile-navigation" className="container border-t border-black/10 pb-4 lg:hidden" aria-label={locale === "fr" ? "Navigation mobile" : "Mobile navigation"}>
          {[...links, { href: `/${locale}/compte`, label: copy.nav.account }].map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={pathname === href ? "page" : undefined} className="block border-b border-black/10 py-3 text-sm font-semibold last:border-0">{label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
