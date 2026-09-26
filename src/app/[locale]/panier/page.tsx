"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useCart } from "@/providers/CartProvider";
import { formatTnd } from "@/lib/money";
import { DELIVERY_FEE_MILLIMES } from "@/lib/constants";
import { isLocale } from "@/lib/i18n";

export default function CartPage() {
  const params = useParams<{ locale: string }>();
  const locale = isLocale(params.locale) ? params.locale : "fr";
  const cart = useCart();
  if (!cart.hydrated) return <div className="container section min-h-[45vh]">…</div>;
  if (!cart.items.length) {
    return (
      <div className="container section min-h-[45vh] text-center">
        <h1 className="heading-lg">{locale === "fr" ? "Votre panier est vide" : "Your cart is empty"}</h1>
        <Link href={`/${locale}/montres`} className="mt-7 inline-flex bg-ink px-7 py-3 font-bold text-white">{locale === "fr" ? "Voir les montres" : "Browse watches"}</Link>
      </div>
    );
  }
  return (
    <div className="container section">
      <h1 className="heading-lg">{locale === "fr" ? "Votre panier" : "Your cart"}</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="divide-y divide-black/10">
          {cart.items.map((item) => (
            <article key={item.variantId} className="grid grid-cols-[96px_1fr] gap-4 py-5 sm:grid-cols-[120px_1fr_auto]">
              <div className="relative aspect-[4/5] bg-white"><Image src={item.imageUrl} alt="" fill className="object-cover" sizes="120px" /></div>
              <div>
                <Link href={`/${locale}/montres/${locale === "fr" ? item.productSlugFr : item.productSlugEn}`} className="font-display text-xl">{locale === "fr" ? item.productNameFr : item.productNameEn}</Link>
                <p className="mt-1 text-sm text-black/55">{locale === "fr" ? item.variantLabelFr : item.variantLabelEn}</p>
                <p className="mt-3 font-semibold">{formatTnd(item.unitPriceMillimes, locale)}</p>
                <div className="mt-4 inline-flex items-center border border-black/15">
                  <button type="button" className="p-2 disabled:opacity-30" disabled={item.quantity <= 1} onClick={() => cart.setQuantity(item.variantId, item.quantity - 1)} aria-label={locale === "fr" ? `Diminuer la quantité de ${item.productNameFr}` : `Decrease quantity of ${item.productNameEn}`}><Minus size={15} /></button>
                  <span className="min-w-8 text-center text-sm" aria-live="polite">{item.quantity}</span>
                  <button type="button" className="p-2 disabled:opacity-30" disabled={item.quantity >= Math.min(10, item.maxStock)} onClick={() => cart.setQuantity(item.variantId, item.quantity + 1)} aria-label={locale === "fr" ? `Augmenter la quantité de ${item.productNameFr}` : `Increase quantity of ${item.productNameEn}`}><Plus size={15} /></button>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4 sm:block sm:text-right">
                <p className="font-bold">{formatTnd(item.unitPriceMillimes * item.quantity, locale)}</p>
                <button type="button" className="mt-4 text-red-700" onClick={() => cart.removeItem(item.variantId)} aria-label={locale === "fr" ? `Retirer ${item.productNameFr}` : `Remove ${item.productNameEn}`}><Trash2 size={18} /></button>
              </div>
            </article>
          ))}
        </div>
        <aside className="admin-card h-fit">
          <h2 className="font-display text-2xl">{locale === "fr" ? "Récapitulatif" : "Summary"}</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt>{locale === "fr" ? "Sous-total" : "Subtotal"}</dt><dd>{formatTnd(cart.subtotalMillimes, locale)}</dd></div>
            <div className="flex justify-between"><dt>{locale === "fr" ? "Livraison" : "Delivery"}</dt><dd>{formatTnd(DELIVERY_FEE_MILLIMES, locale)}</dd></div>
            <div className="flex justify-between border-t border-black/10 pt-4 text-lg font-bold"><dt>Total</dt><dd>{formatTnd(cart.subtotalMillimes + DELIVERY_FEE_MILLIMES, locale)}</dd></div>
          </dl>
          <Link href={`/${locale}/commande`} className="mt-6 flex min-h-12 items-center justify-center bg-ink px-7 text-base font-semibold text-white transition hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">{locale === "fr" ? "Passer la commande" : "Checkout"}</Link>
          <p className="mt-4 text-xs leading-5 text-black/55">{locale === "fr" ? "Aucun paiement en ligne. Vous payez au livreur après confirmation téléphonique." : "No online payment. You pay the courier after phone confirmation."}</p>
        </aside>
      </div>
    </div>
  );
}
