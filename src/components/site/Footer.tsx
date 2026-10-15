import Link from "next/link";
import { Banknote, PhoneCall, Truck } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { publicEnv } from "@/lib/env";
import { BrandLogo } from "@/components/site/BrandLogo";

export function Footer({ locale }: { locale: Locale }) {
  const french = locale === "fr";
  const groups: Array<{ title: string; links: Array<[string, string]> }> = [
    {
      title: french ? "Découvrir" : "Explore",
      links: [
        [french ? "Toutes les montres" : "All watches", `/${locale}/montres`],
        [french ? "Notre maison" : "Our house", `/${locale}/a-propos`],
        [french ? "Favoris" : "Wishlist", `/${locale}/favoris`],
      ],
    },
    {
      title: french ? "Aide" : "Help",
      links: [
        [french ? "Livraison & retours" : "Delivery & returns", `/${locale}/livraison-retours`],
        ["Contact", `/${locale}/contact`],
        [french ? "Mon compte" : "My account", `/${locale}/compte`],
      ],
    },
    {
      title: french ? "Informations" : "Information",
      links: [
        [french ? "Confidentialité" : "Privacy", `/${locale}/confidentialite`],
        [french ? "Conditions de vente" : "Terms of sale", `/${locale}/conditions`],
      ],
    },
  ];
  const promises = [
    { icon: Truck, title: french ? "Livraison nationale" : "Nationwide delivery", text: french ? "Offerte dès 100 DT, partout en Tunisie" : "Free from 100 DT, anywhere in Tunisia" },
    { icon: PhoneCall, title: french ? "Confirmation par appel" : "Confirmed by phone", text: french ? "Un conseiller vous rappelle" : "An advisor calls you back" },
    { icon: Banknote, title: french ? "Paiement à la réception" : "Pay on arrival", text: french ? "Aucun paiement en ligne" : "No online payment" },
  ];
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-white">
      <div className="border-b border-white/10">
        <div className="container grid gap-6 py-10 sm:grid-cols-3">
          {promises.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/40 text-gold"><Icon size={18} strokeWidth={1.6} /></span>
              <div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-white/55">{text}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="container grid gap-12 py-14 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Link href={`/${locale}`} className="mb-6 inline-flex" aria-label={french ? "Hora — accueil" : "Hora — home"}><BrandLogo tone="gold" /></Link>
          <p className="mb-4 text-[10px] uppercase tracking-[.35em] text-gold">Time. Redefined.</p>
          <p className="max-w-sm font-display text-3xl font-medium leading-tight text-white/90">
            {french ? "Des montres pour les jours qui comptent." : "Watches for the days that matter."}
          </p>
          {(publicEnv.contactPhone || publicEnv.contactEmail) && (
            <div className="mt-6 space-y-1 text-sm text-white/65">
              {publicEnv.contactPhone && <a className="block transition hover:text-gold" href={`tel:${publicEnv.contactPhone.replace(/[^+\d]/g, "")}`}>{publicEnv.contactPhone}</a>}
              {publicEnv.contactEmail && <a className="block transition hover:text-gold" href={`mailto:${publicEnv.contactEmail}`}>{publicEnv.contactEmail}</a>}
            </div>
          )}
        </div>
        {groups.map(({ title, links }) => (
          <nav key={title} aria-label={title}>
            <h2 className="text-[11px] font-bold uppercase tracking-[.2em] text-gold">{title}</h2>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              {links.map(([label, href]) => (
                <li key={href}><Link href={href} className="transition hover:text-white focus-visible:text-white">{label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/50 sm:flex-row">
          <span>© {new Date().getFullYear()} Hora · {french ? "Tunisie" : "Tunisia"}</span>
          <span>{french ? "Paiement à la livraison · Prix en dinars tunisiens" : "Cash on delivery · Prices in Tunisian dinars"}</span>
        </div>
      </div>
    </footer>
  );
}
