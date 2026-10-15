"use client";

import Link from "next/link";
import { ArrowRight, Banknote, PhoneCall, ShoppingBag, Truck } from "lucide-react";
import { useParams } from "next/navigation";
import { useCart } from "@/providers/CartProvider";
import { addDeliveryFee, formatTnd } from "@/lib/money";
import { DeliveryFee, FreeDeliveryProgress } from "@/components/cart/FreeDelivery";
import { isLocale } from "@/lib/i18n";
import { CartLine } from "@/components/cart/CartLine";

export default function CartPage() {
  const params = useParams<{ locale: string }>();
  const locale = isLocale(params.locale) ? params.locale : "fr";
  const french = locale === "fr";
  const cart = useCart();

  if (!cart.hydrated) {
    return (
      <div className="container section" aria-busy="true">
        <div className="skeleton h-12 w-64" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">{[0, 1].map((index) => <div key={index} className="skeleton h-40" />)}</div>
          <div className="skeleton h-72" />
        </div>
      </div>
    );
  }

  if (!cart.items.length) {
    return (
      <div className="container section flex min-h-[55vh] flex-col items-center justify-center text-center">
        <div className="grid h-24 w-24 animate-scale-in place-items-center rounded-full bg-sand text-gold-dark"><ShoppingBag size={34} strokeWidth={1.4} /></div>
        <h1 className="heading-md mt-8 animate-fade-up">{french ? "Votre panier est vide" : "Your cart is empty"}</h1>
        <p className="mt-3 animate-fade-up text-ink/60 [animation-delay:80ms]">{french ? "Les montres que vous ajoutez apparaîtront ici." : "Watches you add will appear here."}</p>
        <Link href={`/${locale}/montres`} className="btn-primary mt-8 animate-fade-up [animation-delay:160ms]">{french ? "Voir les montres" : "Browse watches"} <ArrowRight size={16} /></Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <p className="eyebrow animate-fade-up">{french ? "Panier" : "Cart"}</p>
      <h1 className="heading-lg mt-3 animate-fade-up [animation-delay:80ms]">{french ? "Votre panier" : "Your cart"}</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-14">
        <div className="divide-y divide-ink/10 border-y border-ink/10">
          {cart.items.map((item) => <CartLine key={item.variantId} item={item} locale={locale} />)}
        </div>
        <aside className="h-fit animate-fade-up rounded-3xl bg-white p-6 shadow-soft [animation-delay:160ms] sm:p-8 lg:sticky lg:top-28">
          <h2 className="font-display text-3xl font-medium">{french ? "Récapitulatif" : "Summary"}</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between text-ink/65"><dt>{french ? "Sous-total" : "Subtotal"} ({cart.count})</dt><dd className="tabular-nums">{formatTnd(cart.subtotalMillimes, locale)}</dd></div>
            <div className="flex justify-between text-ink/65"><dt>{french ? "Livraison" : "Delivery"}</dt><dd className="tabular-nums"><DeliveryFee subtotalMillimes={cart.subtotalMillimes} locale={locale} /></dd></div>
            <div className="flex items-baseline justify-between border-t border-ink/10 pt-4"><dt className="font-semibold">Total</dt><dd className="font-display text-3xl font-medium tabular-nums">{formatTnd(addDeliveryFee(cart.subtotalMillimes), locale)}</dd></div>
          </dl>
          <div className="mt-5"><FreeDeliveryProgress subtotalMillimes={cart.subtotalMillimes} locale={locale} /></div>
          <Link href={`/${locale}/commande`} className="btn-primary mt-6 w-full">{french ? "Passer la commande" : "Checkout"} <ArrowRight size={16} /></Link>
          <ul className="mt-6 space-y-2.5 text-xs text-ink/60">
            <li className="flex items-center gap-2.5"><Banknote size={15} className="text-gold-dark" /> {french ? "Aucun paiement en ligne — vous payez au livreur." : "No online payment — you pay the courier."}</li>
            <li className="flex items-center gap-2.5"><PhoneCall size={15} className="text-gold-dark" /> {french ? "Confirmation par téléphone avant l'envoi." : "Phone confirmation before shipping."}</li>
            <li className="flex items-center gap-2.5"><Truck size={15} className="text-gold-dark" /> {french ? "Livraison dans les 24 gouvernorats." : "Delivery to all 24 governorates."}</li>
          </ul>
          <Link href={`/${locale}/montres`} className="mt-6 block text-center text-xs font-semibold text-ink/55 hover:text-ink">{french ? "← Continuer mes achats" : "← Continue shopping"}</Link>
        </aside>
      </div>
    </div>
  );
}
