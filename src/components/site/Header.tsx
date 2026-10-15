"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Form from "next/form";
import { usePathname } from "next/navigation";
import { ArrowRight, Heart, Menu, Search, ShoppingBag, Truck, UserRound } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { useCart } from "@/providers/CartProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { BrandLogo } from "@/components/site/BrandLogo";
import { Sheet } from "@/components/ui/Sheet";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

export function Header({ locale }: { locale: Locale }) {
  const copy = t(locale);
  const french = locale === "fr";
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const cart = useCart();
  const { productIds } = useWishlist();
  const [bump, setBump] = useState(false);

  const links = [
    { href: `/${locale}/montres`, label: copy.nav.watches },
    { href: `/${locale}/a-propos`, label: french ? "Notre maison" : "Our house" },
    { href: `/${locale}/livraison-retours`, label: french ? "Livraison & retours" : "Delivery & returns" },
    { href: `/${locale}/contact`, label: "Contact" },
  ];

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        setScrolled(y > 8);
        // Hide while reading downwards; reveal as soon as the visitor scrolls up.
        if (y <= 160) setHidden(false);
        else if (delta > 6) setHidden(true);
        else if (delta < -6) setHidden(false);
        if (Math.abs(delta) > 6 || y <= 160) lastY.current = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!cart.addedTick) return;
    setBump(true);
    setHidden(false);
    const timer = window.setTimeout(() => setBump(false), 500);
    return () => window.clearTimeout(timer);
  }, [cart.addedTick]);

  const headerHidden = hidden && !menuOpen && !searchOpen && !cart.drawerOpen;
  useEffect(() => {
    // Lets sticky toolbars below the header slide up when it hides.
    document.documentElement.dataset.headerHidden = String(headerHidden);
  }, [headerHidden]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <Link
        href={`/${locale}/livraison-retours`}
        className="group block bg-ink text-white/85 transition-colors hover:text-white"
      >
        <div className="container flex h-10 items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[.12em] sm:gap-4 sm:tracking-[.2em]">
          <span aria-hidden="true" className="hidden h-px w-12 bg-gradient-to-r from-transparent to-gold/60 sm:block" />
          <Truck size={15} strokeWidth={1.8} className="shrink-0 text-gold transition-transform duration-500 group-hover:translate-x-0.5" />
          <span className="truncate">
            {french ? <>Livraison <Sheen>offerte</Sheen> dès 100 DT d&apos;achat</> : <><Sheen>Free</Sheen> delivery on orders from 100 DT</>}
          </span>
          <span aria-hidden="true" className="hidden h-px w-12 bg-gradient-to-l from-transparent to-gold/60 sm:block" />
        </div>
      </Link>
      <header
        className={cn(
          "sticky top-0 z-40 transition-[transform,background-color,box-shadow] duration-500 ease-out",
          scrolled ? "bg-ivory/90 shadow-[0_1px_0_rgba(11,11,10,.08)] backdrop-blur-xl backdrop-saturate-150" : "bg-ivory",
          headerHidden ? "-translate-y-full" : "translate-y-0",
        )}
      >
        <div className="container grid h-[var(--header-height)] grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex items-center gap-1">
            <button type="button" className="icon-link -ml-2 lg:hidden" aria-label={french ? "Ouvrir le menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              <Menu size={21} />
            </button>
            <nav className="hidden items-center gap-7 lg:flex" aria-label={french ? "Navigation principale" : "Main navigation"}>
              {links.slice(0, 3).map(({ href, label }) => (
                <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className="nav-link aria-[current=page]:text-ink aria-[current=page]:after:scale-x-100">{label}</Link>
              ))}
            </nav>
          </div>

          <Link href={`/${locale}`} className="inline-flex items-center" aria-label={french ? "Hora — accueil" : "Hora — home"}>
            <BrandLogo />
          </Link>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <button type="button" className="icon-link" aria-label={copy.nav.search} onClick={() => setSearchOpen(true)}><Search size={19} /></button>
            <Link href={`/${locale}/favoris`} className="icon-link hidden sm:grid" aria-label={copy.nav.wishlist}>
              <Heart size={19} />
              {productIds.length > 0 && <span className="count-badge">{productIds.length}</span>}
            </Link>
            <Link href={`/${locale}/compte`} className="icon-link hidden sm:grid" aria-label={copy.nav.account}><UserRound size={19} /></Link>
            <Link
              href={`/${locale}/panier`}
              className="icon-link"
              aria-label={copy.nav.cart}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                event.preventDefault();
                cart.openDrawer();
              }}
            >
              <ShoppingBag size={19} />
              {cart.count > 0 && <span className={cn("count-badge", bump && "animate-bump")}>{cart.count}</span>}
            </Link>
            <div className="ml-1 hidden sm:block"><LocaleSwitcher locale={locale} /></div>
          </div>
        </div>
      </header>

      <Sheet open={menuOpen} onClose={closeMenu} side="left" label={french ? "Menu" : "Menu"} closeLabel={french ? "Fermer le menu" : "Close menu"}>
        <div className="flex h-full flex-col overflow-y-auto px-6 pb-8 pt-6">
          <Link href={`/${locale}`} onClick={closeMenu} className="self-start" aria-label={french ? "Hora — accueil" : "Hora — home"}><BrandLogo /></Link>
          <nav id="mobile-navigation" className="mt-10" aria-label={french ? "Navigation mobile" : "Mobile navigation"}>
            <ul className="space-y-1">
              {[...links, { href: `/${locale}/favoris`, label: copy.nav.wishlist }, { href: `/${locale}/compte`, label: copy.nav.account }].map(({ href, label }, index) => (
                <li key={href} className="animate-fade-up" style={{ animationDelay: `${80 + index * 50}ms` }}>
                  <Link href={href} onClick={closeMenu} aria-current={isActive(href) ? "page" : undefined} className="flex items-center justify-between border-b border-ink/10 py-4 font-display text-3xl font-medium transition-colors hover:text-gold-dark aria-[current=page]:text-gold-dark">
                    {label}
                    <ArrowRight size={18} className="text-ink/30" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto space-y-4 pt-10 text-sm text-ink/60">
            <LocaleSwitcher locale={locale} long />
            {publicEnv.contactPhone && <a href={`tel:${publicEnv.contactPhone.replace(/[^+\d]/g, "")}`} className="block font-semibold text-ink">{publicEnv.contactPhone}</a>}
            <p>{french ? "Paiement à la livraison · Livraison offerte dès 100 DT" : "Cash on delivery · Free delivery from 100 DT"}</p>
          </div>
        </div>
      </Sheet>

      <Sheet open={searchOpen} onClose={closeSearch} side="top" label={copy.nav.search} closeLabel={french ? "Fermer la recherche" : "Close search"}>
        <div className="container py-10 sm:py-14">
          <p className="eyebrow">{copy.nav.search}</p>
          <Form action={`/${locale}/montres`} onSubmit={closeSearch} className="mt-4 flex items-center gap-3 border-b-2 border-ink pb-3">
            <Search size={24} className="shrink-0 text-ink/40" />
            <label htmlFor="header-search" className="sr-only">{french ? "Rechercher une montre" : "Search watches"}</label>
            <input
              id="header-search"
              data-autofocus
              name="q"
              type="search"
              required
              minLength={2}
              maxLength={100}
              autoComplete="off"
              placeholder={french ? "Nom, marque, référence…" : "Name, brand, reference…"}
              className="min-w-0 flex-1 bg-transparent font-display text-3xl outline-none placeholder:text-ink/25 sm:text-5xl"
            />
            <button type="submit" className="btn-primary h-11 shrink-0 px-5" aria-label={copy.nav.search}><ArrowRight size={18} /></button>
          </Form>
          <Link href={`/${locale}/montres`} onClick={closeSearch} className="link-underline mt-6 text-sm">{french ? "Parcourir toute la collection" : "Browse the whole collection"} <ArrowRight size={14} /></Link>
        </div>
      </Sheet>
    </>
  );
}

/** Gold word with a slow light sweep across it; still for visitors who prefer reduced motion. */
function Sheen({ children }: { children: ReactNode }) {
  return (
    <span className="bg-[linear-gradient(110deg,#C9A646_35%,#F3E8BE_50%,#C9A646_65%)] bg-[length:200%_100%] bg-clip-text text-transparent motion-safe:animate-[shimmer_5s_linear_infinite]">
      {children}
    </span>
  );
}
