"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { TUNISIAN_GOVERNORATES, DELIVERY_FEE_MILLIMES } from "@/lib/constants";
import { useCart } from "@/providers/CartProvider";
import { formatTnd } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics/browser";

export function CheckoutForm({ locale }: { locale: Locale }) {
  const cart = useCart();
  const router = useRouter();
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setIdempotencyKey(crypto.randomUUID()), []);
  useEffect(() => {
    if (cart.hydrated && cart.items.length) {
      track("InitiateCheckout", { valueMillimes: cart.subtotalMillimes + DELIVERY_FEE_MILLIMES });
    }
  }, [cart.hydrated, cart.items.length, cart.subtotalMillimes]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!idempotencyKey || !cart.items.length) return;
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
      body: JSON.stringify({
        idempotencyKey,
        locale,
        customerFirstName: form.get("customerFirstName"),
        customerLastName: form.get("customerLastName"),
        customerEmail: form.get("customerEmail"),
        phone: form.get("phone"),
        governorate: form.get("governorate"),
        city: form.get("city"),
        postalCode: form.get("postalCode"),
        addressLine1: form.get("addressLine1"),
        addressLine2: form.get("addressLine2"),
        deliveryInstructions: form.get("deliveryInstructions"),
        customerNotes: form.get("customerNotes") ?? "",
        codAccepted: form.get("codAccepted") === "on",
        items: cart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      }),
    });
    const data = (await response.json()) as { error?: string; accessToken?: string };
    if (!response.ok || !data.accessToken) {
      setError(data.error ?? (locale === "fr" ? "La commande n'a pas pu être enregistrée." : "The order could not be placed."));
      setSubmitting(false);
      return;
    }
    cart.clear();
    router.push(`/${locale}/commande/succes?token=${encodeURIComponent(data.accessToken)}`);
  }

  if (!cart.hydrated) return <div>…</div>;
  if (!cart.items.length) return <p>{locale === "fr" ? "Votre panier est vide." : "Your cart is empty."}</p>;

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        <section className="admin-card">
          <h2 className="font-display text-2xl">{locale === "fr" ? "Coordonnées" : "Contact details"}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label><span className="label">{locale === "fr" ? "Prénom" : "First name"}</span><input className="field mt-2" name="customerFirstName" required minLength={2} maxLength={80} autoComplete="given-name" /></label>
            <label><span className="label">{locale === "fr" ? "Nom" : "Last name"}</span><input className="field mt-2" name="customerLastName" required minLength={2} maxLength={80} autoComplete="family-name" /></label>
            <label><span className="label">{locale === "fr" ? "Téléphone tunisien" : "Tunisian phone"}</span><input className="field mt-2" name="phone" required placeholder="+216 22 111 222" autoComplete="tel" /></label>
            <label><span className="label">Email ({locale === "fr" ? "optionnel" : "optional"})</span><input className="field mt-2" name="customerEmail" type="email" autoComplete="email" /></label>
          </div>
        </section>
        <section className="admin-card">
          <h2 className="font-display text-2xl">{locale === "fr" ? "Adresse de livraison" : "Delivery address"}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label><span className="label">{locale === "fr" ? "Gouvernorat" : "Governorate"}</span><select className="field mt-2" name="governorate" required defaultValue=""><option value="" disabled>—</option>{TUNISIAN_GOVERNORATES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className="label">{locale === "fr" ? "Ville" : "City"}</span><input className="field mt-2" name="city" required minLength={2} autoComplete="address-level2" /></label>
            <label><span className="label">{locale === "fr" ? "Code postal" : "Postal code"}</span><input className="field mt-2" name="postalCode" required pattern="\d{4}" inputMode="numeric" autoComplete="postal-code" /></label>
            <label className="sm:col-span-2"><span className="label">{locale === "fr" ? "Adresse" : "Address"}</span><input className="field mt-2" name="addressLine1" required minLength={5} autoComplete="street-address" /></label>
            <label className="sm:col-span-2"><span className="label">{locale === "fr" ? "Complément" : "Address line 2"}</span><input className="field mt-2" name="addressLine2" /></label>
            <label className="sm:col-span-2"><span className="label">{locale === "fr" ? "Instructions de livraison" : "Delivery instructions"}</span><textarea className="mt-2 min-h-24 w-full border border-black/20 bg-white p-3" name="deliveryInstructions" maxLength={500} /></label>
          </div>
        </section>
      </div>
      <aside className="admin-card h-fit lg:sticky lg:top-28">
        <h2 className="font-display text-2xl">{locale === "fr" ? "Votre commande" : "Your order"}</h2>
        <ul className="mt-5 space-y-3 text-sm">{cart.items.map((item) => <li key={item.variantId} className="flex justify-between gap-3"><span>{item.quantity} × {locale === "fr" ? item.productNameFr : item.productNameEn}</span><span>{formatTnd(item.unitPriceMillimes * item.quantity, locale)}</span></li>)}</ul>
        <dl className="mt-5 space-y-3 border-t border-black/10 pt-4 text-sm">
          <div className="flex justify-between"><dt>{locale === "fr" ? "Sous-total" : "Subtotal"}</dt><dd>{formatTnd(cart.subtotalMillimes, locale)}</dd></div>
          <div className="flex justify-between"><dt>{locale === "fr" ? "Livraison" : "Delivery"}</dt><dd>{formatTnd(DELIVERY_FEE_MILLIMES, locale)}</dd></div>
          <div className="flex justify-between text-lg font-bold"><dt>Total</dt><dd>{formatTnd(cart.subtotalMillimes + DELIVERY_FEE_MILLIMES, locale)}</dd></div>
        </dl>
        <label className="mt-5 flex items-start gap-3 border border-gold/50 bg-gold/10 p-3 text-sm leading-5">
          <input type="checkbox" name="codAccepted" required className="mt-1" />
          <span>{locale === "fr" ? "Je confirme que le paiement s'effectue uniquement à la livraison, après confirmation téléphonique." : "I confirm that payment is made only on delivery, after confirmation by phone."}</span>
        </label>
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting || !idempotencyKey}>{submitting ? locale === "fr" ? "Enregistrement…" : "Placing order…" : locale === "fr" ? "Confirmer la commande" : "Place order"}</Button>
      </aside>
    </form>
  );
}
