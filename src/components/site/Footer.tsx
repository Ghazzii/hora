import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const links: Array<[string, string]> = [
    [locale === "fr" ? "Contact" : "Contact", `/${locale}/contact`],
    [locale === "fr" ? "Confidentialité" : "Privacy", `/${locale}/confidentialite`],
    [locale === "fr" ? "Conditions" : "Terms", `/${locale}/conditions`],
  ];
  return <footer className="mt-20 bg-ink text-white"><div className="container flex flex-col gap-8 py-11 sm:flex-row sm:items-end sm:justify-between"><div><Link href={`/${locale}`} className="font-display text-3xl tracking-[.24em] text-gold">HORA</Link><p className="mt-3 max-w-sm text-sm leading-6 text-white/60">{locale === "fr" ? "Une sélection de montres contemporaines, pensée pour être portée au quotidien." : "A selection of contemporary watches made for everyday wear."}</p></div><nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/65" aria-label="Footer navigation">{links.map(([label, href]) => <Link key={href} href={href} className="hover:text-gold">{label}</Link>)}</nav></div><div className="border-t border-white/10 py-5 text-center text-xs text-white/40">© {new Date().getFullYear()} Hora · Tunisia</div></footer>;
}
