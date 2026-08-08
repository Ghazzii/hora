import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductPurchase } from "@/components/site/ProductPurchase";
import { ReviewForm } from "@/components/site/ReviewForm";
import { TrackView } from "@/components/site/TrackView";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { formatTnd } from "@/lib/money";
import { isLocale } from "@/lib/i18n";
import { safeJson } from "@/lib/utils";
import { publicEnv } from "@/lib/env";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product.categoryId, product.id);
  const name = locale === "fr" ? product.nameFr : product.nameEn;
  const description = locale === "fr" ? product.descriptionFr : product.descriptionEn;
  const image = product.images[0]?.url ?? "/images/watch-1.svg";
  const price = product.variants[0]?.priceMillimes;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: product.images.map((item) => `${publicEnv.baseUrl}${item.url}`),
    description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    aggregateRating: product.reviews.length
      ? { "@type": "AggregateRating", ratingValue: product.averageRating, reviewCount: product.reviews.length }
      : undefined,
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      priceCurrency: "TND",
      price: variant.priceMillimes / 1000,
      availability: variant.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      sku: variant.sku,
    })),
  };

  return (
    <div className="container section">
      <TrackView productId={product.id} valueMillimes={price} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
      <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:gap-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {product.images.map((item, index) => (
            <div key={item.id} className={index === 0 ? "relative aspect-[4/5] overflow-hidden bg-[#ECE7DD] sm:col-span-2" : "relative aspect-[4/5] overflow-hidden bg-[#ECE7DD]"}>
              <Image src={item.url} alt={locale === "fr" ? item.altFr : item.altEn} fill priority={index === 0} sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
            </div>
          ))}
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{product.brand} · {locale === "fr" ? product.category.nameFr : product.category.nameEn}</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">{name}</h1>
          {price && <p className="mt-5 text-xl font-bold">{formatTnd(price, locale)}</p>}
          <p className="mt-6 leading-7 text-black/65">{description}</p>
          <div className="my-7 border-y border-black/10 py-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {[
                [locale === "fr" ? "Mouvement" : "Movement", product.movement],
                [locale === "fr" ? "Boîtier" : "Case", product.caseMaterial],
                [locale === "fr" ? "Bracelet" : "Strap", product.strapMaterial],
                [locale === "fr" ? "Étanchéité" : "Water resistance", product.waterResistance],
                [locale === "fr" ? "Couleur" : "Color", product.color],
                [locale === "fr" ? "Style" : "Style", product.style],
              ].map(([label, value]) => <div key={label}><dt className="text-black/45">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
            </dl>
          </div>
          <ProductPurchase
            locale={locale}
            product={{ id: product.id, slugFr: product.slugFr, slugEn: product.slugEn, nameFr: product.nameFr, nameEn: product.nameEn, imageUrl: image }}
            variants={product.variants}
          />
        </aside>
      </div>

      <section className="mt-20 border-t border-black/10 pt-14">
        <h2 className="heading-lg">{locale === "fr" ? "Avis" : "Reviews"}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {product.reviews.length ? product.reviews.map((review) => (
            <article key={review.id} className="border border-black/10 bg-white p-6">
              <p className="text-gold-dark">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
              <h3 className="mt-3 font-bold">{review.title}</h3>
              <p className="mt-2 text-sm leading-6 text-black/65">{review.body}</p>
              <p className="mt-4 text-xs text-black/45">{review.user.firstName}{review.verified ? locale === "fr" ? " · Achat vérifié" : " · Verified purchase" : ""}</p>
            </article>
          )) : <p className="text-black/60">{locale === "fr" ? "Aucun avis pour le moment." : "No reviews yet."}</p>}
        </div>
        <ReviewForm productId={product.id} locale={locale} />
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="heading-lg">{locale === "fr" ? "Vous aimerez aussi" : "You may also like"}</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-7">
            {related.map((item) => <ProductCard key={item.id} product={item} locale={locale} />)}
          </div>
        </section>
      )}
    </div>
  );
}
