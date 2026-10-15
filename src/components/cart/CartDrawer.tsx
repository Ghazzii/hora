"use client";

import Link from "next/link";
import { ArrowRight, PhoneCall, ShoppingBag, Truck } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { addDeliveryFee, formatTnd } from "@/lib/money";
import { DeliveryFee, FreeDeliveryProgress } from "@/components/cart/FreeDelivery";
import { useCart } from "@/providers/CartProvider";
import { Sheet } from "@/components/ui/Sheet";
import { CartLine } from "@/components/cart/CartLine";

export function CartDrawer({ locale }: { locale: Locale }) {
  const cart = useCart();
  const french = locale === "fr";
  return (
    <Sheet open={cart.drawerOpen} onClose={cart.closeDrawer} label={french ? "Votre panier" : "Your cart"} closeLabel={french ? "Fermer" : "Close"}>
      <div className="border-b border-ink/10 px-5 pb-4 pt-5 sm:px-6">
        <p className="eyebrow">{french ? "Panier" : "Cart"}</p>
        <h2 className="mt-1 font-display text-3xl font-medium">
          {french ? "Votre sélection" : "Your selection"}{" "}
          {cart.count > 0 && <span className="text-ink/40">({cart.count})</span>}
        </h2>
      </div>

      {cart.items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-sand text-gold-dark">
            <ShoppingBag size={30} strokeWidth={1.5} />
          </div>
          <p className="mt-6 font-display text-2xl">{french ? "Votre panier est vide" : "Your cart is empty"}</p>
          <p className="mt-2 text-sm text-ink/55">{french ? "Trouvez la montre qui vous accompagnera." : "Find the watch that will go everywhere with you."}</p>
          <Link href={`/${locale}/montres`} onClick={cart.closeDrawer} className="btn-primary mt-7">
            {french ? "Voir les montres" : "Browse watches"} <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          <div className="flex-1 divide-y divide-ink/10 overflow-y-auto overscroll-contain px-5 sm:px-6">
            {cart.items.map((item) => (
              <CartLine key={item.variantId} item={item} locale={locale} compact onNavigate={cart.closeDrawer} />
            ))}
          </div>
          <div className="border-t border-ink/10 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
            <FreeDeliveryProgress subtotalMillimes={cart.subtotalMillimes} locale={locale} />
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink/65"><dt>{french ? "Sous-total" : "Subtotal"}</dt><dd className="tabular-nums">{formatTnd(cart.subtotalMillimes, locale)}</dd></div>
              <div className="flex justify-between text-ink/65"><dt className="flex items-center gap-1.5"><Truck size={14} /> {french ? "Livraison" : "Delivery"}</dt><dd className="tabular-nums"><DeliveryFee subtotalMillimes={cart.subtotalMillimes} locale={locale} /></dd></div>
              <div className="flex justify-between pt-2 text-lg font-bold"><dt>Total</dt><dd className="tabular-nums">{formatTnd(addDeliveryFee(cart.subtotalMillimes), locale)}</dd></div>
            </dl>
            <Link href={`/${locale}/commande`} onClick={cart.closeDrawer} className="btn-primary mt-4 w-full">
              {french ? "Commander — paiement à la livraison" : "Checkout — pay on delivery"} <ArrowRight size={16} />
            </Link>
            <Link href={`/${locale}/panier`} onClick={cart.closeDrawer} className="mt-3 block text-center text-xs font-semibold text-ink/60 underline-offset-4 hover:text-ink hover:underline">
              {french ? "Voir le panier complet" : "View full cart"}
            </Link>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink/50">
              <PhoneCall size={12} /> {french ? "Nous vous appelons pour confirmer avant l'envoi." : "We call you to confirm before shipping."}
            </p>
          </div>
        </>
      )}
    </Sheet>
  );
}
