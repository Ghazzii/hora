import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDownRight, ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import { getFeaturedProducts } from "@/lib/products";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { alternates: { canonical: `/${locale}`, languages: { fr: "/fr", en: "/en", "x-default": "/fr" } } };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const products = await getFeaturedProducts(6).catch(() => null);
  const french = locale === "fr";
  return (
    <>
      <section className="container py-4 sm:py-7">
        <div className="relative grid min-h-[620px] overflow-hidden rounded-[2rem] bg-[#1a1a18] text-white lg:grid-cols-[.85fr_1.15fr]">
          <div className="relative z-10 flex flex-col justify-between p-7 sm:p-12 lg:p-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">HORA — TUNIS</p>
              <h1 className="mt-7 max-w-lg font-display text-5xl leading-[.92] sm:text-7xl lg:text-8xl">{french ? "Le temps vous appartient." : "Time is yours."}</h1>
              <p className="mt-7 max-w-sm text-sm leading-7 text-white/65 sm:text-base">{french ? "Des montres pensées pour accompagner les jours qui comptent." : "Watches designed for the days that matter."}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4"><Link href={`/${locale}/montres`} className="inline-flex h-12 items-center gap-3 rounded-full bg-gold px-6 text-sm font-bold text-ink transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{french ? "Découvrir la collection" : "Shop the collection"} <ArrowRight size={17} /></Link><a href="#collection" className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 text-white transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={french ? "Voir la sélection" : "View selection"}><ArrowDownRight size={19} /></a></div>
          </div>
          <div className="relative min-h-[360px] lg:min-h-0"><Image src="/images/hero-watch.svg" alt="Hora watch" fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover object-center" /><div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" /><div className="absolute bottom-6 right-6 rounded-full border border-white/25 bg-black/20 px-4 py-2 text-xs backdrop-blur">{french ? "Collection 2026" : "Collection 2026"}</div></div>
        </div>
      </section>

      <section className="container grid gap-5 py-12 sm:grid-cols-[1fr_auto] sm:items-end sm:py-20">
        <div><p className="eyebrow">{french ? "La sélection" : "The selection"}</p><h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-6xl">{french ? "Des lignes nettes. Une présence discrète." : "Clean lines. Quiet presence."}</h2></div>
        <p className="max-w-xs text-sm leading-6 text-black/55">{french ? "Choisissez une pièce faite pour être portée, pas simplement regardée." : "Choose a piece made to be worn, not simply looked at."}</p>
      </section>

      <section id="collection" className="container pb-16 sm:pb-24">
        <div className="flex items-center justify-between border-b border-black/10 pb-5"><h2 className="font-display text-3xl sm:text-4xl">{french ? "À découvrir" : "Discover"}</h2><Link href={`/${locale}/montres`} className="inline-flex items-center gap-2 text-sm font-bold hover:text-gold-dark">{french ? "Tout voir" : "View all"} <ArrowRight size={16} /></Link></div>
        {products === null ? <p role="status" className="mt-8 rounded-xl border border-gold/40 bg-white p-6 text-sm leading-6">{french ? "La collection est momentanément indisponible. Merci de réessayer bientôt." : "The collection is temporarily unavailable. Please try again soon."}</p> : products.length ? <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-9 sm:gap-5 lg:grid-cols-3 lg:gap-7">{products.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}</div> : <p className="mt-8 text-sm text-black/60">{french ? "De nouvelles montres arrivent bientôt." : "New watches are coming soon."}</p>}
      </section>

      <section className="border-y border-black/10 bg-white"><div className="container grid gap-7 py-8 sm:grid-cols-2 sm:gap-12 sm:py-10"><div className="flex gap-4"><Truck className="mt-1 shrink-0 text-gold-dark" size={22} /><div><h2 className="font-semibold">{french ? "Livraison partout en Tunisie" : "Delivery across Tunisia"}</h2><p className="mt-1 text-sm text-black/55">{french ? "8 DT, directement à votre porte." : "8 DT, delivered directly to your door."}</p></div></div><div className="flex gap-4"><ShieldCheck className="mt-1 shrink-0 text-gold-dark" size={22} /><div><h2 className="font-semibold">{french ? "Paiement à la livraison" : "Cash on delivery"}</h2><p className="mt-1 text-sm text-black/55">{french ? "Nous confirmons chaque commande par téléphone." : "We confirm every order by phone."}</p></div></div></div></section>
    </>
  );
}
