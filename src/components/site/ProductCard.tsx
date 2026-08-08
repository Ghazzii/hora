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
  return (
    <article className="group relative">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#ECE7DD]">
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
      </div>
      <div className="pt-4">
        <p className="text-xs uppercase tracking-[.16em] text-black/55">{product.brand}</p>
        <Link href={`/${locale}/montres/${slug}`} className="mt-1 block font-display text-xl">
          {name}
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2 text-sm">
          <span className="font-semibold">{variant ? formatTnd(variant.priceMillimes, locale) : "—"}</span>
          <span className="text-black/55">★ {product.averageRating.toFixed(1)}</span>
        </div>
      </div>
    </article>
  );
}
