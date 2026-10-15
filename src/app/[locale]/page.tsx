import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Banknote, PackageCheck, PhoneCall } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
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

  const steps = [
    { icon: PackageCheck, title: french ? "Vous commandez" : "You order", text: french ? "Choisissez votre montre et laissez vos coordonnées. Aucune carte bancaire n'est demandée." : "Pick your watch and leave your details. No bank card required." },
    { icon: PhoneCall, title: french ? "Nous vous appelons" : "We call you", text: french ? "Un membre de l'équipe Hora confirme la commande et l'adresse avec vous." : "A member of the Hora team confirms the order and address with you." },
    { icon: Banknote, title: french ? "Vous payez à la livraison" : "You pay on delivery", text: french ? "Le livreur vous remet la montre partout en Tunisie. Vous payez à ce moment-là." : "The courier hands you the watch anywhere in Tunisia. You pay at that moment." },
  ];
  const marquee = french
    ? ["Paiement à la livraison", "Livraison offerte dès 100 DT", "24 gouvernorats", "Confirmation par téléphone", "Pensée à Tunis"]
    : ["Cash on delivery", "Free delivery from 100 DT", "24 governorates", "Confirmed by phone", "Designed in Tunis"];

  return (
    <>
      <section className="container pt-3 sm:pt-5">
        <div className="relative isolate grid min-h-[min(88svh,760px)] overflow-hidden rounded-[2rem] bg-[#12110e] text-white lg:grid-cols-[1fr_1fr]">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_72%_45%,rgba(201,166,70,.28),transparent_55%),radial-gradient(ellipse_at_10%_100%,rgba(201,166,70,.12),transparent_50%)]" />
          <div aria-hidden="true" className="grain -z-10" />
          <div aria-hidden="true" className="absolute right-[-10%] top-1/2 -z-10 hidden h-[130%] -translate-y-1/2 lg:block">
            <svg viewBox="0 0 600 600" className="h-full w-auto opacity-[.12]">
              <circle cx="300" cy="300" r="290" fill="none" stroke="#C9A646" strokeWidth=".8" />
              <circle cx="300" cy="300" r="230" fill="none" stroke="#C9A646" strokeWidth=".6" strokeDasharray="2 10" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col justify-between gap-10 p-7 sm:p-12 lg:p-16">
            <p className="animate-fade-up text-[11px] font-bold uppercase tracking-[.3em] text-gold">Hora — Tunis</p>
            <div>
              <h1 className="max-w-xl font-display text-[clamp(3.25rem,9vw,7.5rem)] font-medium leading-[.88] tracking-[-.02em]">
                <span className="block animate-fade-up [animation-delay:120ms]">{french ? "Le temps" : "Time"}</span>{" "}
                <span className="block animate-fade-up italic text-gold [animation-delay:220ms]">{french ? "vous appartient." : "is yours."}</span>
              </h1>
              <p className="mt-7 max-w-md animate-fade-up text-[15px] leading-7 text-white/65 [animation-delay:340ms] sm:text-base">
                {french
                  ? "Des montres sélectionnées pour accompagner les jours qui comptent. Livrées partout en Tunisie, payées à la réception."
                  : "Watches selected for the days that matter. Delivered anywhere in Tunisia, paid on arrival."}
              </p>
              <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:460ms]">
                <Link href={`/${locale}/montres`} className="btn-gold group">
                  {french ? "Découvrir la collection" : "Shop the collection"}
                  <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <a href="#collection" className="btn h-12 border border-white/20 px-6 text-sm text-white hover:border-gold hover:text-gold">
                  {french ? "La sélection" : "The selection"}
                </a>
              </div>
            </div>
            <dl className="grid max-w-md animate-fade-up grid-cols-3 gap-4 border-t border-white/10 pt-6 [animation-delay:600ms]">
              {[
                [french ? "Offerte" : "Free", french ? "Livraison dès 100 DT" : "Delivery from 100 DT"],
                ["24", french ? "Gouvernorats" : "Governorates"],
                ["0 DT", french ? "Payé en ligne" : "Paid online"],
              ].map(([value, label]) => (
                <div key={label}><dt className="sr-only">{label}</dt><dd className="font-display text-3xl font-medium text-white">{value}</dd><dd className="mt-1 text-[11px] uppercase tracking-[.16em] text-white/45">{label}</dd></div>
              ))}
            </dl>
          </div>

          <Link href={`/${locale}/montres/versace-green`} className="group relative block min-h-[460px] overflow-hidden lg:min-h-0" aria-label={french ? "Découvrir la montre Versace à cadran vert" : "Explore the Versace green-dial watch"}>
            <Image src="/images/products/versace-green/04-editorial.webp" alt={french ? "Montre Versace dorée à cadran vert sur un socle en pierre" : "Gold-tone Versace watch with a green dial on a stone plinth"} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-[1.5s] group-hover:scale-[1.03]" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#12110e]/20 via-transparent to-[#12110e]/40 lg:bg-gradient-to-r lg:from-[#12110e] lg:via-[#12110e]/5 lg:to-transparent" />
            <p className="absolute bottom-6 right-6 flex items-center gap-3 rounded-full border border-white/30 bg-ink/50 px-5 py-3 text-xs tracking-[.08em] text-white backdrop-blur">
              {french ? "Versace · Cadran vert" : "Versace · Green dial"} <ArrowUpRight size={16} />
            </p>
          </Link>
        </div>
      </section>

      <div className="relative mt-10 overflow-hidden border-y border-ink/10 py-5" aria-hidden="true">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-display text-2xl italic text-ink/70 sm:text-3xl">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((item, index) => (
            <span key={index} className="flex items-center gap-10">{item}<span className="text-base not-italic text-gold">◆</span></span>
          ))}
        </div>
      </div>

      <section id="collection" className="container scroll-mt-24 py-16 sm:py-24">
        <Reveal className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="eyebrow">{french ? "La sélection" : "The selection"}</p>
            <h2 className="heading-lg mt-4 max-w-3xl">{french ? <>Des lignes nettes.<br /><span className="italic text-ink/55">Une présence discrète.</span></> : <>Clean lines.<br /><span className="italic text-ink/55">Quiet presence.</span></>}</h2>
          </div>
          <Link href={`/${locale}/montres`} className="link-underline text-sm">{french ? "Toute la collection" : "View all watches"} <ArrowUpRight size={16} /></Link>
        </Reveal>
        {products === null ? (
          <p role="status" className="mt-10 rounded-2xl border border-gold/40 bg-white p-6 text-sm leading-6">{french ? "La collection est momentanément indisponible. Merci de réessayer bientôt." : "The collection is temporarily unavailable. Please try again soon."}</p>
        ) : products.length ? (
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:mt-14 sm:gap-x-5 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
            {products.map((product, index) => (
              <Reveal key={product.id} delay={(index % 3) * 110}>
                <ProductCard product={product} locale={locale} priority={index < 2} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-10 text-sm text-ink/60">{french ? "De nouvelles montres arrivent bientôt." : "New watches are coming soon."}</p>
        )}
      </section>

      <section className="bg-white">
        <div className="container py-16 sm:py-24">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">{french ? "Simple et sans risque" : "Simple and risk-free"}</p>
            <h2 className="heading-md mt-4">{french ? "Commandez aujourd'hui, payez quand vous la tenez en main." : "Order today, pay when it's in your hands."}</h2>
          </Reveal>
          <ol className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <Reveal as="li" key={title} delay={index * 120} className="group relative overflow-hidden rounded-2xl border border-ink/[.08] bg-ivory p-7 transition duration-500 hover:-translate-y-1 hover:shadow-lift">
                <span aria-hidden="true" className="absolute -right-2 -top-6 font-display text-[7rem] font-medium leading-none text-ink/[.04] transition-colors duration-500 group-hover:text-gold/15">{index + 1}</span>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-gold transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110"><Icon size={20} strokeWidth={1.6} /></span>
                <h3 className="mt-6 font-display text-2xl font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">{text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="container py-16 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <Reveal variant="scale" className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-black">
            <Image src="/images/brand/hora-signature.webp" alt="HORA — Time. Redefined." fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-6 sm:p-8" />
          </Reveal>
          <Reveal delay={120}>
            <p className="eyebrow">{french ? "Notre maison" : "Our house"}</p>
            <h2 className="heading-md mt-4">{french ? "Des montres choisies avec soin." : "Watches chosen with care."}</h2>
            <p className="mt-6 max-w-lg leading-8 text-ink/65">
              {french
                ? "Du bracelet bijou au cadran sportif, Hora sélectionne des montres pour chaque style. Chaque commande est suivie par notre équipe, de l'appel de confirmation jusqu'à votre porte."
                : "From jewellery bracelets to sporty dials, Hora selects watches for every style. Every order is followed by our team, from the confirmation call to your door."}
            </p>
            <Link href={`/${locale}/a-propos`} className="link-underline mt-8 text-sm">{french ? "Découvrir notre histoire" : "Read our story"} <ArrowRight size={15} /></Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
