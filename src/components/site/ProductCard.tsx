import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { formatTnd } from "@/lib/money";
import { WishlistButton } from "@/components/site/WishlistButton";
import { QuickAdd } from "@/components/site/QuickAdd";

export type ProductCardProduct = {
  id: string;
  slugFr: string;
  slugEn: string;
  nameFr: string;
  nameEn: string;
  brand: string;
  averageRating: number;
  images: { url: string; altFr: string; altEn: string }[];
  variants: {
    id: string;
    labelFr: string;
    labelEn: string;
    priceMillimes: number;
    compareAtPriceMillimes: number | null;
    stock: number;
  }[];
};

export function ProductCard({
  product,
  locale,
  priority = false,
}: {
  product: ProductCardProduct;
  locale: Locale;
  priority?: boolean;
}) {
  const french = locale === "fr";
  const variant = product.variants[0];
  const slug = french ? product.slugFr : product.slugEn;
  const name = french ? product.nameFr : product.nameEn;
  const href = `/${locale}/montres/${slug}`;
  const [image, hoverImage] = product.images;
  const discount =
    variant?.compareAtPriceMillimes && variant.compareAtPriceMillimes > variant.priceMillimes
      ? Math.round((1 - variant.priceMillimes / variant.compareAtPriceMillimes) * 100)
      : 0;
  const totalStock = product.variants.reduce((sum, item) => sum + item.stock, 0);
  const lowStock = totalStock > 0 && totalStock <= 3;
  const multiplePrices = new Set(product.variants.map((item) => item.priceMillimes)).size > 1;

  return (
    <article className="group relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
        <Link href={href} className="absolute inset-0" aria-label={name}>
          <Image
            src={image?.url ?? "/images/watch-1.svg"}
            alt={french ? image?.altFr ?? name : image?.altEn ?? name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-[1.2s] ease-out group-hover:scale-[1.06]"
          />
          {hoverImage && (
            <Image
              src={hoverImage.url}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover opacity-0 transition duration-700 ease-out group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {totalStock <= 0 && <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-white">{french ? "Épuisée" : "Sold out"}</span>}
          {discount > 0 && totalStock > 0 && <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold tracking-[.08em] text-ink">−{discount}%</span>}
          {lowStock && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-ink backdrop-blur">{french ? "Dernières pièces" : "Last pieces"}</span>}
        </div>

        <WishlistButton
          productId={product.id}
          label={french ? `Ajouter ${name} aux favoris` : `Add ${name} to wishlist`}
          className="absolute right-3 top-3"
        />

        {totalStock > 0 && (
          <div className="absolute bottom-3 right-3 md:inset-x-3 md:translate-y-3 md:opacity-0 md:transition md:duration-500 md:ease-out md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100">
            <QuickAdd
              locale={locale}
              product={{
                id: product.id,
                slugFr: product.slugFr,
                slugEn: product.slugEn,
                nameFr: product.nameFr,
                nameEn: product.nameEn,
                imageUrl: image?.url ?? "/images/watch-1.svg",
                variants: product.variants.map(({ id, labelFr, labelEn, priceMillimes, stock }) => ({ id, labelFr, labelEn, priceMillimes, stock })),
              }}
            />
          </div>
        )}
      </div>

      <div className="px-1 pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[10px] font-bold uppercase tracking-[.2em] text-ink/45">{product.brand}</p>
          {product.averageRating > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-ink/55" aria-label={french ? `Note ${product.averageRating.toFixed(1)} sur 5` : `Rated ${product.averageRating.toFixed(1)} out of 5`}>
              <Star size={11} className="fill-gold text-gold" /> {product.averageRating.toFixed(1)}
            </span>
          )}
        </div>
        <h3 className="mt-1.5">
          <Link href={href} className="font-display text-xl font-medium leading-tight transition-colors hover:text-gold-dark sm:text-[22px]">{name}</Link>
        </h3>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-semibold tabular-nums">
            {variant ? `${multiplePrices ? (french ? "Dès " : "From ") : ""}${formatTnd(variant.priceMillimes, locale)}` : "—"}
          </span>
          {discount > 0 && <span className="text-xs text-ink/40 line-through tabular-nums">{formatTnd(variant!.compareAtPriceMillimes!, locale)}</span>}
        </p>
      </div>
    </article>
  );
}
