import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const french = locale === "fr";
  const groups: Array<{ title: string; links: Array<[string, string]> }> = [
    {
      title: french ? "Découvrir" : "Explore",
      links: [
        [french ? "Toutes les montres" : "All watches", `/${locale}/montres`],
        [french ? "Notre histoire" : "Our story", `/${locale}/a-propos`],
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
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="container grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div><Link href={`/${locale}`} className="font-display text-3xl tracking-[.24em] text-gold">HORA</Link><p className="mt-4 max-w-sm text-sm leading-6 text-white/70">{french ? "Des montres contemporaines pour les jours qui comptent. Livraison dans toute la Tunisie et paiement à la réception." : "Contemporary watches for the days that matter. Delivery across Tunisia and payment on arrival."}</p></div>
        {groups.map(({ title, links }) => <nav key={title} aria-label={title}><h2 className="text-sm font-bold text-white">{title}</h2><ul className="mt-4 space-y-3 text-sm text-white/70">{links.map(([label, href]) => <li key={href}><Link href={href} className="hover:text-gold focus-visible:text-gold">{label}</Link></li>)}</ul></nav>)}
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/60">© {new Date().getFullYear()} Hora · Tunisia</div>
    </footer>
  );
}
