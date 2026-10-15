import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronRight, Star } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductPurchase } from "@/components/site/ProductPurchase";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ReviewForm } from "@/components/site/ReviewForm";
import { TrackView } from "@/components/site/TrackView";
import { Reveal } from "@/components/motion/Reveal";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { isLocale } from "@/lib/i18n";
import { genderLabel } from "@/lib/product-labels";
import { safeJson } from "@/lib/utils";
import { publicEnv } from "@/lib/env";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) return {};

  const french = locale === "fr";
  const name = french ? product.nameFr : product.nameEn;
  const description = (french ? product.seoDescriptionFr : product.seoDescriptionEn) ?? (french ? product.descriptionFr : product.descriptionEn);
  const localizedSlug = french ? product.slugFr : product.slugEn;
  const image = product.images[0]?.url;

  return {
    title: (french ? product.seoTitleFr : product.seoTitleEn) ?? name,
    description,
    alternates: {
      canonical: `/${locale}/montres/${localizedSlug}`,
      languages: {
        fr: `/fr/montres/${product.slugFr}`,
        en: `/en/montres/${product.slugEn}`,
      },
    },
    openGraph: {
      type: "website",
      locale: french ? "fr_TN" : "en_TN",
      title: name,
      description,
      images: image ? [{ url: image, alt: name }] : [],
    },
  };
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((index) => (
        <Star key={index} size={size} strokeWidth={1.5} className={index <= Math.round(value) ? "fill-gold text-gold" : "text-ink/20"} />
      ))}
    </span>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const french = locale === "fr";
  const result = await getProductBySlug(slug).then((product) => ({ product, failed: false })).catch(() => ({ product: null, failed: true }));
  if (result.failed) {
    return (
      <div className="container section min-h-[50vh]">
        <p className="eyebrow">Hora</p>
        <h1 className="heading-lg mt-3">{french ? "Montre momentanément indisponible" : "Watch temporarily unavailable"}</h1>
        <p className="mt-5 text-ink/65">{french ? "Veuillez réessayer bientôt." : "Please try again soon."}</p>
      </div>
    );
  }
  const product = result.product;
  if (!product) notFound();
  const related = await getRelatedProducts(product.categoryId, product.id).catch(() => []);
  const name = french ? product.nameFr : product.nameEn;
  const description = french ? product.descriptionFr : product.descriptionEn;
  const image = product.images[0]?.url ?? "/images/watch-1.svg";
  const price = product.variants[0]?.priceMillimes;
  const reviewCount = product.reviews.length;
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: product.reviews.filter((review) => review.rating === stars).length }));
  const dateFormat = new Intl.DateTimeFormat(french ? "fr-TN" : "en-GB", { month: "long", year: "numeric" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: product.images.map((item) => new URL(item.url, publicEnv.baseUrl).href),
    description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    aggregateRating: reviewCount
      ? { "@type": "AggregateRating", ratingValue: product.averageRating, reviewCount }
      : undefined,
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      priceCurrency: "TND",
      price: variant.priceMillimes / 1000,
      availability: variant.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      sku: variant.sku,
    })),
  };

  const specs = [
    [french ? "Mouvement" : "Movement", product.movement],
    [french ? "Boîtier" : "Case", product.caseMaterial],
    [french ? "Bracelet" : "Strap", product.strapMaterial],
    [french ? "Étanchéité" : "Water resistance", product.waterResistance],
    [french ? "Couleur" : "Colour", product.color],
    [french ? "Style" : "Style", product.style],
    [french ? "Pour" : "For", genderLabel(product.gender, locale)],
    [french ? "Référence" : "Reference", product.sku],
  ].filter(([, value]) => value);

  return (
    <div className="container pb-16 pt-6 sm:pt-8">
      <TrackView productId={product.id} valueMillimes={price} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />

      <nav aria-label={french ? "Fil d'Ariane" : "Breadcrumb"} className="mb-6 flex items-center gap-1.5 overflow-hidden text-xs text-ink/50">
        <Link href={`/${locale}`} className="shrink-0 hover:text-ink">Hora</Link>
        <ChevronRight size={12} className="shrink-0" />
        <Link href={`/${locale}/montres`} className="shrink-0 hover:text-ink">{french ? "Montres" : "Watches"}</Link>
        <ChevronRight size={12} className="shrink-0" />
        <span className="truncate text-ink/80" aria-current="page">{name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] lg:gap-16">
        <div className="min-w-0 animate-fade-in">
          <ProductGallery
            locale={locale}
            name={name}
            images={product.images.map((item) => ({ id: item.id, url: item.url, alt: french ? item.altFr : item.altEn }))}
          />
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow animate-fade-up">{product.brand} · {french ? product.category.nameFr : product.category.nameEn}</p>
          <h1 className="mt-3 animate-fade-up font-display text-5xl font-medium leading-[.95] tracking-[-.01em] [animation-delay:80ms] sm:text-6xl">{name}</h1>
          {reviewCount > 0 && (
            <a href="#reviews" className="mt-4 inline-flex animate-fade-up items-center gap-2 text-sm text-ink/60 [animation-delay:120ms] hover:text-ink">
              <Stars value={product.averageRating} />
              <span>{product.averageRating.toFixed(1)} · {reviewCount} {french ? "avis" : reviewCount > 1 ? "reviews" : "review"}</span>
            </a>
          )}
          <p className="mt-6 animate-fade-up leading-7 text-ink/65 [animation-delay:160ms]">{description}</p>
          <div className="mt-8 animate-fade-up [animation-delay:240ms]">
            <ProductPurchase
              locale={locale}
              product={{ id: product.id, slugFr: product.slugFr, slugEn: product.slugEn, nameFr: product.nameFr, nameEn: product.nameEn, imageUrl: image }}
              variants={product.variants}
            />
          </div>
        </aside>
      </div>

      <Reveal as="section" className="mt-20 grid gap-10 border-t border-ink/10 pt-14 lg:grid-cols-[.8fr_1.2fr]">
        <h2 className="heading-md">{french ? "Caractéristiques" : "Specifications"}</h2>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-4">
          {specs.map(([label, value]) => (
            <div key={label} className="bg-ivory p-5">
              <dt className="text-[11px] font-bold uppercase tracking-[.16em] text-ink/45">{label}</dt>
              <dd className="mt-2 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <Reveal as="section" className="mt-20 scroll-mt-28 border-t border-ink/10 pt-14">
        <div id="reviews" className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <h2 className="heading-md">{french ? "Avis clients" : "Customer reviews"}</h2>
            {reviewCount > 0 ? (
              <div className="mt-6">
                <p className="flex items-end gap-3"><span className="font-display text-6xl font-medium leading-none">{product.averageRating.toFixed(1)}</span><span className="pb-1 text-sm text-ink/50">/ 5 · {reviewCount} {french ? "avis" : "reviews"}</span></p>
                <ul className="mt-5 max-w-xs space-y-1.5">
                  {distribution.map(({ stars, count }) => (
                    <li key={stars} className="flex items-center gap-3 text-xs text-ink/55">
                      <span className="w-3 tabular-nums">{stars}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10"><span className="block h-full rounded-full bg-gold" style={{ width: `${(count / reviewCount) * 100}%` }} /></span>
                      <span className="w-5 text-right tabular-nums">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-ink/60">{french ? "Soyez le premier à partager votre avis." : "Be the first to share your thoughts."}</p>
            )}
            <div className="mt-8"><ReviewForm productId={product.id} locale={locale} /></div>
          </div>
          {reviewCount > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {product.reviews.map((review) => (
                <article key={review.id} className="card p-6">
                  <Stars value={review.rating} />
                  <h3 className="mt-4 font-semibold">{review.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{review.body}</p>
                  <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/45">
                    <span className="font-semibold text-ink/70">{review.user.firstName}</span>
                    <span>· {dateFormat.format(new Date(review.createdAt))}</span>
                    {review.verified && <span className="inline-flex items-center gap-1 text-emerald-800"><BadgeCheck size={13} /> {french ? "Achat vérifié" : "Verified purchase"}</span>}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      {related.length > 0 && (
        <section className="mt-24">
          <Reveal className="flex items-end justify-between gap-4">
            <h2 className="heading-md">{french ? "Vous aimerez aussi" : "You may also like"}</h2>
            <Link href={`/${locale}/montres`} className="link-underline hidden text-sm sm:inline-flex">{french ? "Toute la collection" : "All watches"}</Link>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-7">
            {related.map((item, index) => (
              <Reveal key={item.id} delay={index * 90}>
                <ProductCard product={item} locale={locale} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
