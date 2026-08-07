"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWishlist } from "@/providers/WishlistProvider";
import { isLocale } from "@/lib/i18n";
import { formatTnd } from "@/lib/money";

type WishlistProduct = {
  id: string;
  slugFr: string;
  slugEn: string;
  nameFr: string;
  nameEn: string;
  images: { url: string }[];
  variants: { priceMillimes: number }[];
};

export default function WishlistPage() {
  const route = useParams<{ locale: string }>();
  const locale = isLocale(route.locale) ? route.locale : "fr";
  const wishlist = useWishlist();
  const [products, setProducts] = useState<WishlistProduct[]>([]);

  useEffect(() => {
    if (!wishlist.hydrated || wishlist.productIds.length === 0) {
      setProducts([]);
      return;
    }
    void fetch(`/api/products?ids=${wishlist.productIds.join(",")}`)
      .then((response) => response.json())
      .then((data: { products: WishlistProduct[] }) => setProducts(data.products));
  }, [wishlist.hydrated, wishlist.productIds]);

  return (
    <div className="container section min-h-[45vh]">
      <h1 className="heading-lg">{locale === "fr" ? "Vos favoris" : "Your wishlist"}</h1>
      {!wishlist.productIds.length ? (
        <p className="mt-6 text-black/60">{locale === "fr" ? "Vous n'avez encore ajouté aucune montre." : "You have not added any watches yet."}</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <article key={product.id}>
              <Link href={`/${locale}/montres/${locale === "fr" ? product.slugFr : product.slugEn}`}>
                <div className="relative aspect-[4/5] bg-white"><Image src={product.images[0]?.url ?? "/images/watch-1.svg"} alt="" fill className="object-cover" /></div>
                <h2 className="mt-3 font-display text-xl">{locale === "fr" ? product.nameFr : product.nameEn}</h2>
              </Link>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>{product.variants[0] ? formatTnd(product.variants[0].priceMillimes, locale) : "—"}</span>
                <button onClick={() => wishlist.toggle(product.id)} className="border-b border-black text-xs">{locale === "fr" ? "Retirer" : "Remove"}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
