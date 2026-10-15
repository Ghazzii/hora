"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronDown, Loader2, Lock, ShoppingBag } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { TUNISIAN_GOVERNORATES } from "@/lib/constants";
import { DeliveryFee, FreeDeliveryProgress } from "@/components/cart/FreeDelivery";
import { citiesOf } from "@/lib/tunisia-cities";
import { useCart } from "@/providers/CartProvider";
import { addDeliveryFee, formatTnd } from "@/lib/money";
import { normalizeTunisianPhone } from "@/lib/phone";
import { track } from "@/lib/analytics/browser";
import { cn, optionLabel } from "@/lib/utils";

const REMEMBER_KEY = "hora_checkout_details_v1";
const REMEMBERED_FIELDS = ["customerFirstName", "customerLastName", "customerEmail", "phone", "governorate", "city", "postalCode", "addressLine1", "addressLine2"] as const;

type FieldName =
  | "customerFirstName" | "customerLastName" | "customerEmail" | "phone" | "governorate"
  | "city" | "postalCode" | "addressLine1" | "addressLine2" | "deliveryInstructions" | "codAccepted";
type Errors = Partial<Record<FieldName, string>>;

/** Value of the "Ville" choice that switches to a free-text city. */
const OTHER_CITY = "__other";

/** Mirrors the server's checkout schema so customers see problems before submitting. */
function validate(form: FormData, french: boolean): Errors {
  const value = (name: string) => String(form.get(name) ?? "").trim();
  const errors: Errors = {};
  // French labels carry their own agreement ("requis" / "requise").
  const length = (name: FieldName, min: number, max: number, label: string, required = french ? `${label} est requis.` : `${label} is required.`) => {
    const text = value(name);
    if (!text) errors[name] = required;
    else if (text.length < min) errors[name] = french ? `${label} : ${min} caractères minimum.` : `${label}: at least ${min} characters.`;
    else if (text.length > max) errors[name] = french ? `${label} : ${max} caractères maximum.` : `${label}: at most ${max} characters.`;
  };
  length("customerFirstName", 2, 80, french ? "Le prénom" : "First name");
  length("customerLastName", 2, 80, french ? "Le nom" : "Last name");
  if (!normalizeTunisianPhone(value("phone"))) errors.phone = french ? "Entrez un numéro tunisien valide (8 chiffres, ex. 22 111 222)." : "Enter a valid Tunisian number (8 digits, e.g. 22 111 222).";
  const email = value("customerEmail");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.customerEmail = french ? "Adresse email invalide." : "Invalid email address.";
  if (!value("governorate")) errors.governorate = french ? "Choisissez votre gouvernorat." : "Choose your governorate.";
  length("city", 2, 100, french ? "La ville" : "City", french ? "La ville est requise." : undefined);
  if (value("postalCode") && !/^\d{4}$/.test(value("postalCode"))) errors.postalCode = french ? "Le code postal contient 4 chiffres." : "Postal code has 4 digits.";
  length("addressLine1", 5, 200, french ? "L'adresse" : "Address", french ? "L'adresse est requise." : undefined);
  if (value("deliveryInstructions").length > 500) errors.deliveryInstructions = french ? "500 caractères maximum." : "500 characters maximum.";
  if (form.get("codAccepted") !== "on") errors.codAccepted = french ? "Veuillez confirmer le paiement à la livraison." : "Please confirm payment on delivery.";
  return errors;
}

function formatPhone(raw: string) {
  const normalized = normalizeTunisianPhone(raw);
  if (!normalized) return raw;
  const digits = normalized.slice(4);
  return `+216 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}

function Field({ label, name, error, hint, className, children }: { label: string; name: FieldName; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={`checkout-${name}`} className="label">{label}</label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`checkout-${name}-error`} className="field-error animate-fade-in"><AlertCircle size={13} /> {error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink/45">{hint}</p>
      ) : null}
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-soft sm:p-8">
      <h2 className="flex items-center gap-3 font-display text-2xl font-medium sm:text-3xl">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-sans text-sm font-bold text-white">{number}</span>
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function CheckoutForm({ locale }: { locale: Locale }) {
  const french = locale === "fr";
  const cart = useCart();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<{ text: string; stock?: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [remember, setRemember] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [governorate, setGovernorate] = useState("");
  const [city, setCity] = useState("");
  const [otherCity, setOtherCity] = useState(false);
  const cities = citiesOf(governorate);
  const total = addDeliveryFee(cart.subtotalMillimes);

  useEffect(() => setIdempotencyKey(crypto.randomUUID()), []);
  useEffect(() => {
    if (cart.hydrated && cart.items.length) track("InitiateCheckout", { valueMillimes: addDeliveryFee(cart.subtotalMillimes) });
  }, [cart.hydrated, cart.items.length, cart.subtotalMillimes]);

  // Prefill details the customer chose to remember on this device.
  useEffect(() => {
    if (!cart.hydrated || !formRef.current) return;
    try {
      const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) ?? "null") as Record<string, unknown> | null;
      if (!saved || typeof saved !== "object") return;
      const savedGovernorate = typeof saved.governorate === "string" ? saved.governorate : "";
      const savedCity = typeof saved.city === "string" ? saved.city : "";
      if (citiesOf(savedGovernorate).length) {
        setGovernorate(savedGovernorate);
        setCity(savedCity);
        setOtherCity(Boolean(savedCity) && !citiesOf(savedGovernorate).includes(savedCity));
      }
      for (const name of REMEMBERED_FIELDS) {
        // Governorate and city are controlled by state, set above.
        if (name === "governorate" || name === "city") continue;
        const element = formRef.current.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
        if (element && typeof saved[name] === "string" && !element.value) element.value = saved[name] as string;
      }
      setRemember(true);
    } catch { /* Storage may be unavailable. */ }
  }, [cart.hydrated]);

  const describe = (name: FieldName) => ({
    id: `checkout-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `checkout-${name}-error` : undefined,
    onBlur: (event: { currentTarget: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }) => {
      // Re-check a field the customer has already been told about, so errors clear as they fix them.
      if (!errors[name] || !formRef.current) return;
      const next = validate(new FormData(formRef.current), french);
      setErrors((current) => ({ ...current, [name]: next[name] }));
      if (name === "phone" && !next.phone) event.currentTarget.value = formatPhone(event.currentTarget.value);
    },
  });

  function focusFirstError(found: Errors) {
    const first = (Object.keys(found) as FieldName[])[0];
    if (!first) return;
    const element = document.getElementById(`checkout-${first}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    element?.focus({ preventScroll: true });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!idempotencyKey || !cart.items.length || submitting) return;
    const form = new FormData(event.currentTarget);
    const found = validate(form, french);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) {
      focusFirstError(found);
      return;
    }
    setSubmitting(true);
    try {
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
          customerNotes: "",
          codAccepted: form.get("codAccepted") === "on",
          items: cart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; code?: string; accessToken?: string; issues?: Partial<Record<FieldName, string[]>> };
      if (!response.ok || !data.accessToken) {
        if (response.status === 422 && data.issues) {
          const serverErrors: Errors = {};
          for (const name of Object.keys(data.issues) as FieldName[]) serverErrors[name] = validate(form, french)[name] ?? (french ? "Valeur invalide." : "Invalid value.");
          setErrors(serverErrors);
          focusFirstError(serverErrors);
          return;
        }
        if (response.status === 409) {
          setFormError({ stock: true, text: french ? "Un article de votre panier n'est plus disponible dans la quantité demandée. Ajustez votre panier puis réessayez." : "An item in your cart is no longer available in that quantity. Adjust your cart and try again." });
          return;
        }
        if (response.status === 429) {
          setFormError({ text: french ? "Trop de tentatives. Patientez une minute puis réessayez." : "Too many attempts. Wait a minute, then try again." });
          return;
        }
        setFormError({ text: french ? "La commande n'a pas pu être enregistrée. Réessayez dans un instant." : "The order could not be placed. Please try again in a moment." });
        return;
      }
      try {
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, JSON.stringify(Object.fromEntries(REMEMBERED_FIELDS.map((name) => [name, String(form.get(name) ?? "")]))));
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      } catch { /* Remembering details is optional. */ }
      setPlaced(true);
      cart.clear();
      router.push(`/${locale}/commande/succes?token=${encodeURIComponent(data.accessToken)}`);
    } catch {
      setFormError({ text: french ? "Connexion interrompue. Vérifiez votre réseau et réessayez." : "Connection interrupted. Check your network and try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (!cart.hydrated) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]" aria-busy="true">
        <div className="space-y-6"><div className="skeleton h-72" /><div className="skeleton h-96" /></div>
        <div className="skeleton h-96" />
      </div>
    );
  }
  if (placed) {
    return (
      <div role="status" className="flex flex-col items-center rounded-3xl bg-white px-6 py-16 text-center shadow-soft">
        <Loader2 size={28} className="animate-spin text-gold-dark" />
        <p className="mt-4 font-display text-2xl">{french ? "Commande enregistrée…" : "Order placed…"}</p>
      </div>
    );
  }
  if (!cart.items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-ink/15 px-6 py-16 text-center">
        <ShoppingBag className="mx-auto text-gold-dark" size={32} strokeWidth={1.4} />
        <p className="mt-4 font-display text-2xl">{french ? "Votre panier est vide." : "Your cart is empty."}</p>
        <Link href={`/${locale}/montres`} className="btn-primary mt-6">{french ? "Voir les montres" : "Browse watches"}</Link>
      </div>
    );
  }

  const summary = (
    <>
      <ul className="space-y-4">
        {cart.items.map((item) => (
          <li key={item.variantId} className="flex items-center gap-4">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
              <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">{item.quantity}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{french ? item.productNameFr : item.productNameEn}</p>
              {optionLabel(french ? item.variantLabelFr : item.variantLabelEn) && <p className="text-xs text-ink/50">{optionLabel(french ? item.variantLabelFr : item.variantLabelEn)}</p>}
            </div>
            <span className="text-sm font-semibold tabular-nums">{formatTnd(item.unitPriceMillimes * item.quantity, locale)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-6 space-y-2.5 border-t border-ink/10 pt-5 text-sm">
        <div className="flex justify-between text-ink/65"><dt>{french ? "Sous-total" : "Subtotal"}</dt><dd className="tabular-nums">{formatTnd(cart.subtotalMillimes, locale)}</dd></div>
        <div className="flex justify-between text-ink/65"><dt>{french ? "Livraison" : "Delivery"}</dt><dd className="tabular-nums"><DeliveryFee subtotalMillimes={cart.subtotalMillimes} locale={locale} /></dd></div>
        <div className="flex items-baseline justify-between border-t border-ink/10 pt-4"><dt className="font-semibold">{french ? "À payer à la livraison" : "Due on delivery"}</dt><dd className="font-display text-3xl font-medium tabular-nums">{formatTnd(total, locale)}</dd></div>
      </dl>
      <div className="mt-5"><FreeDeliveryProgress subtotalMillimes={cart.subtotalMillimes} locale={locale} /></div>
    </>
  );

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
      <div className="lg:hidden">
        <button type="button" onClick={() => setSummaryOpen((open) => !open)} aria-expanded={summaryOpen} className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-sm font-semibold shadow-soft">
          <span className="flex items-center gap-2"><ShoppingBag size={16} /> {french ? "Votre commande" : "Your order"} ({cart.count})</span>
          <span className="flex items-center gap-2 tabular-nums">{formatTnd(total, locale)} <ChevronDown size={16} className={cn("transition-transform duration-300", summaryOpen && "rotate-180")} /></span>
        </button>
        <div className={cn("grid transition-[grid-template-rows] duration-500 ease-out", summaryOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
          <div className="overflow-hidden"><div className="mt-2 rounded-2xl bg-white p-5 shadow-soft">{summary}</div></div>
        </div>
      </div>

      <div className="space-y-6">
        <Step number={1} title={french ? "Vos coordonnées" : "Your details"}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={french ? "Prénom" : "First name"} name="customerFirstName" error={errors.customerFirstName}>
              <input className="field" {...describe("customerFirstName")} maxLength={80} autoComplete="given-name" />
            </Field>
            <Field label={french ? "Nom" : "Last name"} name="customerLastName" error={errors.customerLastName}>
              <input className="field" {...describe("customerLastName")} maxLength={80} autoComplete="family-name" />
            </Field>
            <Field label={french ? "Téléphone tunisien" : "Tunisian phone"} name="phone" error={errors.phone} hint={french ? "Nous appelons ce numéro pour confirmer." : "We call this number to confirm."}>
              <input
                className="field"
                {...describe("phone")}
                onBlur={(event) => {
                  describe("phone").onBlur(event);
                  if (normalizeTunisianPhone(event.currentTarget.value)) event.currentTarget.value = formatPhone(event.currentTarget.value);
                }}
                type="tel"
                placeholder="+216 22 111 222"
                autoComplete="tel"
                inputMode="tel"
              />
            </Field>
            <Field label={french ? "Email (optionnel)" : "Email (optional)"} name="customerEmail" error={errors.customerEmail}>
              <input className="field" {...describe("customerEmail")} type="email" autoComplete="email" maxLength={160} />
            </Field>
          </div>
        </Step>

        <Step number={2} title={french ? "Adresse de livraison" : "Delivery address"}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={french ? "Gouvernorat" : "Governorate"} name="governorate" error={errors.governorate}>
              <select
                className="field"
                {...describe("governorate")}
                value={governorate}
                onChange={(event) => {
                  setGovernorate(event.target.value);
                  setCity("");
                  setOtherCity(false);
                  if (errors.governorate) setErrors((current) => ({ ...current, governorate: undefined }));
                }}
                autoComplete="address-level1"
              >
                <option value="" disabled>{french ? "Choisir…" : "Choose…"}</option>
                {TUNISIAN_GOVERNORATES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label={french ? "Ville" : "City"} name="city" error={errors.city} hint={!governorate ? (french ? "Choisissez d'abord le gouvernorat." : "Choose the governorate first.") : undefined}>
              {/* The list switches to a text box for localities it doesn't include, so no customer is blocked. */}
              <select
                className="field"
                {...(otherCity ? { id: "checkout-city-choice", "aria-label": french ? "Ville" : "City" } : describe("city"))}
                value={otherCity ? OTHER_CITY : city}
                disabled={!governorate}
                onChange={(event) => {
                  const other = event.target.value === OTHER_CITY;
                  setOtherCity(other);
                  setCity(other ? "" : event.target.value);
                  if (errors.city) setErrors((current) => ({ ...current, city: undefined }));
                }}
                autoComplete="address-level2"
              >
                <option value="" disabled>{french ? "Choisir…" : "Choose…"}</option>
                {cities.map((item) => <option key={item}>{item}</option>)}
                <option value={OTHER_CITY}>{french ? "Autre ville…" : "Other city…"}</option>
              </select>
              {otherCity && (
                <input
                  className="field mt-2"
                  {...describe("city")}
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  maxLength={100}
                  autoComplete="address-level2"
                  placeholder={french ? "Votre ville ou localité" : "Your town or locality"}
                  autoFocus
                />
              )}
            </Field>
            <Field label={french ? "Adresse" : "Address"} name="addressLine1" error={errors.addressLine1} className="sm:col-span-2">
              <input className="field" {...describe("addressLine1")} maxLength={200} autoComplete="address-line1" placeholder={french ? "Rue, numéro, quartier" : "Street, number, area"} />
            </Field>
            <Field label={french ? "Complément (optionnel)" : "Address line 2 (optional)"} name="addressLine2" error={errors.addressLine2}>
              <input className="field" {...describe("addressLine2")} maxLength={200} autoComplete="address-line2" placeholder={french ? "Bâtiment, étage…" : "Building, floor…"} />
            </Field>
            <Field label={french ? "Code postal (optionnel)" : "Postal code (optional)"} name="postalCode" error={errors.postalCode}>
              <input className="field" {...describe("postalCode")} maxLength={4} inputMode="numeric" autoComplete="postal-code" placeholder="1000" />
            </Field>
            <Field label={french ? "Instructions de livraison (optionnel)" : "Delivery instructions (optional)"} name="deliveryInstructions" error={errors.deliveryInstructions} className="sm:col-span-2">
              <textarea className="field" {...describe("deliveryInstructions")} maxLength={500} rows={3} placeholder={french ? "Repère, horaires où vous êtes disponible…" : "Landmark, times you're available…"} />
            </Field>
          </div>
          <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm text-ink/70">
            <input type="checkbox" name="rememberDetails" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-ink" />
            {french ? "Mémoriser mes coordonnées sur cet appareil" : "Remember my details on this device"}
          </label>
        </Step>
      </div>

      <aside className="h-fit space-y-5 lg:sticky lg:top-28">
        <section className="hidden rounded-3xl bg-white p-6 shadow-soft sm:p-8 lg:block">
          <h2 className="font-display text-2xl font-medium">{french ? "Votre commande" : "Your order"}</h2>
          <div className="mt-6">{summary}</div>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-soft sm:p-8">
          <label className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm leading-5 transition", errors.codAccepted ? "border-red-600 bg-red-50" : "border-gold/50 bg-gold/10")}>
            <input type="checkbox" name="codAccepted" id="checkout-codAccepted" aria-invalid={errors.codAccepted ? true : undefined} className="mt-0.5 h-4 w-4 shrink-0 accent-ink" onChange={() => errors.codAccepted && setErrors((current) => ({ ...current, codAccepted: undefined }))} />
            <span>{french ? "Je confirme que le paiement s'effectue uniquement à la livraison, après confirmation téléphonique." : "I confirm that payment is made only on delivery, after confirmation by phone."}</span>
          </label>
          {errors.codAccepted && <p className="field-error"><AlertCircle size={13} /> {errors.codAccepted}</p>}
          {formError && (
            <div role="alert" className="mt-4 animate-fade-in rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-800">
              {formError.text}{" "}
              {formError.stock && <Link href={`/${locale}/panier`} className="font-semibold underline">{french ? "Modifier le panier" : "Edit cart"}</Link>}
            </div>
          )}
          <button type="submit" className="btn-primary mt-5 h-14 w-full text-base" disabled={submitting || !idempotencyKey}>
            {submitting ? <><Loader2 size={18} className="animate-spin" /> {french ? "Enregistrement…" : "Placing order…"}</> : french ? "Confirmer la commande" : "Place order"}
          </button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink/50"><Lock size={12} /> {french ? `Vous paierez ${formatTnd(total, locale)} au livreur.` : `You will pay ${formatTnd(total, locale)} to the courier.`}</p>
        </section>
      </aside>
    </form>
  );
}
