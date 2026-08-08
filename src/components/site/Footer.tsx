import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const links: Array<[string, string]> = [
    [locale === "fr" ? "À propos" : "About", `/${locale}/a-propos`],
    [locale === "fr" ? "Contact" : "Contact", `/${locale}/contact`],
    [locale === "fr" ? "Livraison & retours" : "Delivery & returns", `/${locale}/livraison-retours`],
    [locale === "fr" ? "Confidentialité" : "Privacy", `/${locale}/confidentialite`],
    [locale === "fr" ? "Conditions" : "Terms", `/${locale}/conditions`],
  ];
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="container grid gap-10 py-16 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display text-4xl tracking-[.2em] text-gold">HORA</p>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
            {locale === "fr"
              ? "Des montres contemporaines pensées en Tunisie. Commandez en ligne, confirmez par téléphone et payez à la livraison."
              : "Contemporary watches created for Tunisia. Order online, confirm by phone and pay on delivery."}
          </p>
        </div>
        <div>
          <h2 className="mb-4 font-semibold">{locale === "fr" ? "Informations" : "Information"}</h2>
          <ul className="space-y-3 text-sm text-white/70">
            {links.map(([label, href]) => (
              <li key={href}><Link href={href} className="hover:text-gold">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 font-semibold">{locale === "fr" ? "Commande" : "Ordering"}</h2>
          <p className="text-sm leading-6 text-white/70">
            {locale === "fr"
              ? "Livraison nationale 8 DT. Aucun paiement en ligne. Notre équipe vous appelle avant la préparation."
              : "Nationwide delivery 8 DT. No online payment. Our team calls before preparation."}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Hora · Tunisia
      </div>
    </footer>
  );
}
