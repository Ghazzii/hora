"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Heart } from "lucide-react";
import { useWishlist } from "@/providers/WishlistProvider";
import { isLocale } from "@/lib/i18n";
import { ProductCard, type ProductCardProduct } from "@/components/site/ProductCard";

export default function WishlistPage() {
  const route = useParams<{ locale: string }>();
  const locale = isLocale(route.locale) ? route.locale : "fr";
  const french = locale === "fr";
  const wishlist = useWishlist();
  const [products, setProducts] = useState<ProductCardProduct[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const idsKey = wishlist.productIds.join(",");

  useEffect(() => {
    if (!wishlist.hydrated) return;
    if (!idsKey) {
      setProducts([]);
      return;
    }
    const controller = new AbortController();
    setLoadError(false);
    void fetch(`/api/products?ids=${idsKey}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Wishlist unavailable");
        return response.json() as Promise<{ products: ProductCardProduct[] }>;
      })
      .then((data) => setProducts(data.products))
      .catch(() => { if (!controller.signal.aborted) setLoadError(true); });
    return () => controller.abort();
  }, [wishlist.hydrated, idsKey]);

  // Keep removed items out of view immediately, without waiting for a refetch.
  const visible = products?.filter((product) => wishlist.productIds.includes(product.id)) ?? null;

  return (
    <div className="container section min-h-[55vh]">
      <p className="eyebrow animate-fade-up">{french ? "Favoris" : "Wishlist"}</p>
      <h1 className="heading-lg mt-3 animate-fade-up [animation-delay:80ms]">{french ? "Vos favoris" : "Your wishlist"}</h1>
      {wishlist.hydrated && !wishlist.productIds.length ? (
        <div className="mt-12 flex flex-col items-center rounded-3xl border border-dashed border-ink/15 px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-sand text-gold-dark"><Heart size={26} strokeWidth={1.5} /></span>
          <p className="mt-5 font-display text-2xl">{french ? "Aucune montre pour l'instant" : "No watches yet"}</p>
          <p className="mt-2 max-w-sm text-sm text-ink/55">{french ? "Touchez le cœur sur une montre pour la retrouver ici." : "Tap the heart on any watch to keep it here."}</p>
          <Link href={`/${locale}/montres`} className="btn-primary mt-7">{french ? "Explorer la collection" : "Explore the collection"} <ArrowRight size={16} /></Link>
        </div>
      ) : loadError ? (
        <p role="status" className="mt-8 rounded-2xl bg-white p-6 text-ink/60">{french ? "Vos favoris ne peuvent pas être chargés pour le moment. Réessayez bientôt." : "Your wishlist cannot be loaded right now. Please try again soon."}</p>
      ) : visible === null ? (
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: Math.max(1, Math.min(4, wishlist.productIds.length)) }, (_, index) => (
            <div key={index}><div className="skeleton aspect-[4/5] rounded-2xl" /><div className="skeleton mt-4 h-4 w-2/3" /><div className="skeleton mt-2 h-4 w-1/3" /></div>
          ))}
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-7">
          {visible.map((product) => <div key={product.id} className="animate-fade-up"><ProductCard product={product} locale={locale} /></div>)}
        </div>
      )}
    </div>
  );
}
