import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { formatTnd } from "@/lib/money";
import { WishlistButton } from "@/components/site/WishlistButton";

type ProductCardProduct = {
  id: string;
  slugFr: string;
  slugEn: string;
  nameFr: string;
  nameEn: string;
  brand: string;
  averageRating: number;
  images: { url: string; altFr: string; altEn: string }[];
  variants: {
    priceMillimes: number;
    compareAtPriceMillimes: number | null;
    stock: number;
  }[];
};

export function ProductCard({
  product,
  locale,
}: {
  product: ProductCardProduct;
  locale: Locale;
}) {
  const variant = product.variants[0];
  const slug = locale === "fr" ? product.slugFr : product.slugEn;
  const name = locale === "fr" ? product.nameFr : product.nameEn;
  const image = product.images[0];
  const onSale = Boolean(
    variant?.compareAtPriceMillimes &&
      variant.compareAtPriceMillimes > (variant?.priceMillimes ?? 0),
  );
  const lowStock = Boolean(variant && variant.stock > 0 && variant.stock <= 3);
  return (
    <article className="group relative rounded-[1.25rem] bg-white p-2 shadow-[0_1px_0_rgba(10,10,10,.08)] transition duration-300 hover:-translate-y-1 hover:shadow-luxury">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[.85rem] bg-[#ECE7DD]">
        <Link href={`/${locale}/montres/${slug}`}>
          <Image
            src={image?.url ?? "/images/watch-1.svg"}
            alt={locale === "fr" ? image?.altFr ?? name : image?.altEn ?? name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        </Link>
        <WishlistButton
          productId={product.id}
          label={locale === "fr" ? "Ajouter aux favoris" : "Add to wishlist"}
          className="absolute right-3 top-3"
        />
        {variant && variant.stock <= 0 && (
          <span className="absolute bottom-3 left-3 bg-ink px-3 py-1 text-xs text-white">
            {locale === "fr" ? "Épuisée" : "Sold out"}
          </span>
        )}
        {lowStock && (
          <span className="absolute bottom-3 left-3 bg-gold px-3 py-1 text-xs font-bold text-ink">
            {locale === "fr" ? "Dernières pièces" : "Low stock"}
          </span>
        )}
      </div>
      <div className="px-2 pb-3 pt-4">
        <p className="text-xs uppercase tracking-[.16em] text-black/55">{product.brand}</p>
        <Link href={`/${locale}/montres/${slug}`} className="mt-1 block font-display text-xl">
          {name}
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <span className="font-semibold">{variant ? formatTnd(variant.priceMillimes, locale) : "—"}</span>
            {onSale && (
              <span className="text-xs text-black/45 line-through">
                {formatTnd(variant!.compareAtPriceMillimes!, locale)}
              </span>
            )}
          </span>
          <span className="text-black/55">★ {product.averageRating.toFixed(1)}</span>
        </div>
      </div>
    </article>
  );
}
