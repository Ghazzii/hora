import Image from "next/image";
import Link from "next/link";
import { Truck, PhoneCall, WalletCards } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import { getFeaturedProducts } from "@/lib/products";
import { db } from "@/lib/db";
import { isLocale, t } from "@/lib/i18n";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [products, categories] = await Promise.all([
    getFeaturedProducts(6),
    db.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const copy = t(locale);
  return (
    <>
      <section className="relative min-h-[72vh] overflow-hidden bg-ink text-white">
        <Image
          src="/images/hero-watch.svg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/65 to-transparent" />
        <div className="container relative flex min-h-[72vh] items-center py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">{locale === "fr" ? "Le temps, autrement" : "Time, reconsidered"}</p>
            <h1 className="heading-xl mt-5">
              {locale === "fr"
                ? "Des montres qui racontent la Tunisie."
                : "Watches that tell Tunisia's story."}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
              {locale === "fr"
                ? "Une collection contemporaine, livrée partout en Tunisie. Commandez sans carte et payez uniquement à la livraison."
                : "A contemporary collection delivered throughout Tunisia. Order without a card and pay only on delivery."}
            </p>
            <Link href={`/${locale}/montres`} className="mt-8 inline-flex h-13 items-center bg-gold px-7 font-bold text-ink transition hover:bg-white">
              {copy.common.shop}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="container grid gap-5 py-7 sm:grid-cols-3">
          {[
            [Truck, copy.common.delivery, "24 gouvernorats"],
            [WalletCards, copy.common.cod, locale === "fr" ? "Aucune carte requise" : "No card required"],
            [PhoneCall, copy.common.phone, locale === "fr" ? "Avant préparation" : "Before preparation"],
          ].map(([Icon, title, detail]) => {
            const TrustIcon = Icon as typeof Truck;
            return (
              <div key={String(title)} className="flex items-center justify-center gap-4 sm:justify-start">
                <TrustIcon className="text-gold-dark" />
                <div><p className="text-sm font-bold">{String(title)}</p><p className="text-xs text-black/55">{String(detail)}</p></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section container">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="eyebrow">{locale === "fr" ? "Sélection Hora" : "Hora selection"}</p>
            <h2 className="heading-lg mt-3">{locale === "fr" ? "Pièces remarquables" : "Remarkable pieces"}</h2>
          </div>
          <Link href={`/${locale}/montres`} className="hidden border-b border-ink pb-1 text-sm font-semibold sm:block">
            {locale === "fr" ? "Voir toutes" : "View all"}
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-7">
          {products.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}
        </div>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="container">
          <p className="eyebrow">{locale === "fr" ? "Choisir son style" : "Choose your style"}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/${locale}/montres?category=${locale === "fr" ? category.slugFr : category.slugEn}`}
                className="group relative min-h-56 overflow-hidden border border-white/15 p-7"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent transition group-hover:from-gold/20" />
                <span className="relative text-xs text-gold">0{index + 1}</span>
                <h3 className="relative mt-20 font-display text-3xl">{locale === "fr" ? category.nameFr : category.nameEn}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section container text-center">
        <p className="eyebrow">{locale === "fr" ? "Les nouvelles de Hora" : "News from Hora"}</p>
        <h2 className="heading-lg mt-3">{locale === "fr" ? "La liste privée" : "The private list"}</h2>
        <p className="mx-auto mt-4 max-w-xl text-black/60">
          {locale === "fr"
            ? "L'inscription newsletter sera activée avec votre futur fournisseur d'e-mails. Aucune adresse n'est collectée dans cette version."
            : "Newsletter signup will be enabled with your future email provider. No address is collected in this version."}
        </p>
        <div className="mx-auto mt-7 flex max-w-lg gap-2">
          <input className="field" type="email" placeholder="email@example.com" disabled aria-label="Email" />
          <button className="bg-black/20 px-5 text-sm font-bold text-black/60" disabled>
            {locale === "fr" ? "Bientôt" : "Coming soon"}
          </button>
        </div>
      </section>
    </>
  );
}
