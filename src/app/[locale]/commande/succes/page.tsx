import Image from "next/image";
import Link from "next/link";
import { Banknote, PackageCheck, PhoneCall } from "lucide-react";
import { notFound } from "next/navigation";
import { getOrderByAccessToken } from "@/lib/orders";
import { formatTnd } from "@/lib/money";
import { isLocale } from "@/lib/i18n";
import { TrackOrder } from "@/components/site/TrackView";
import { CopyButton } from "@/components/ui/CopyButton";

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale) || !query.token) notFound();
  const order = await getOrderByAccessToken(query.token);
  if (!order) notFound();
  const french = locale === "fr";
  const next = [
    { icon: PhoneCall, title: french ? "Appel de confirmation" : "Confirmation call", text: french ? `Nous appelons le ${order.phone} pour valider les articles et l'adresse.` : `We call ${order.phone} to confirm the items and address.` },
    { icon: PackageCheck, title: french ? "Préparation & envoi" : "Preparation & shipping", text: french ? "Votre montre est soigneusement emballée et confiée au livreur." : "Your watch is carefully packed and handed to the courier." },
    { icon: Banknote, title: french ? "Paiement à la réception" : "Pay on arrival", text: french ? `Vous réglez ${formatTnd(order.totalMillimes, locale)} au livreur.` : `You pay ${formatTnd(order.totalMillimes, locale)} to the courier.` },
  ];
  return (
    <div className="container section">
      <TrackOrder orderId={order.id} orderNumber={order.orderNumber} valueMillimes={order.totalMillimes} />
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <svg viewBox="0 0 64 64" className="mx-auto h-20 w-20 animate-scale-in" aria-hidden="true">
            <circle cx="32" cy="32" r="30" fill="#C9A646" fillOpacity=".15" />
            <circle cx="32" cy="32" r="22" fill="#0B0B0A" />
            <path d="M22 33l7 7 13-15" fill="none" stroke="#C9A646" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" strokeDashoffset="40" className="animate-draw-check" />
          </svg>
          <h1 className="mt-6 animate-fade-up font-display text-5xl font-medium [animation-delay:200ms] sm:text-6xl">{french ? "Commande bien reçue" : "Order received"}</h1>
          <p className="mx-auto mt-4 max-w-lg animate-fade-up leading-7 text-ink/65 [animation-delay:300ms]">
            {french ? `Merci ${order.customerFirstName} ! L'équipe Hora vous appellera très bientôt.` : `Thank you ${order.customerFirstName}! The Hora team will call you very soon.`}
          </p>
          <div className="mt-5 inline-flex animate-fade-up items-center gap-2 rounded-full border border-ink/10 bg-white py-1 pl-4 pr-1 [animation-delay:400ms]">
            <span className="text-xs text-ink/50">{french ? "Commande" : "Order"}</span>
            <p className="eyebrow text-ink" data-testid="order-number">{order.orderNumber}</p>
            <CopyButton value={order.orderNumber} label={french ? "Copier" : "Copy"} copiedLabel={french ? "Copié" : "Copied"} />
          </div>
        </div>

        <ol className="mt-12 grid animate-fade-up gap-3 [animation-delay:500ms] sm:grid-cols-3">
          {next.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="relative rounded-2xl bg-white p-5 shadow-soft">
              <span className="flex items-center gap-3">
                <span className={index === 0 ? "grid h-10 w-10 place-items-center rounded-full bg-gold text-ink" : "grid h-10 w-10 place-items-center rounded-full bg-sand text-ink/60"}><Icon size={17} /></span>
                <span className="text-[11px] font-bold uppercase tracking-[.16em] text-ink/40">{french ? "Étape" : "Step"} {index + 1}</span>
              </span>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-ink/60">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid animate-fade-up gap-6 rounded-3xl bg-white p-6 shadow-soft [animation-delay:600ms] sm:grid-cols-[1.4fr_1fr] sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-medium">{french ? "Récapitulatif" : "Summary"}</h2>
            <ul className="mt-5 space-y-4">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">{item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />}</div>
                  <div className="min-w-0 flex-1"><p className="truncate font-medium">{french ? item.productNameFr : item.productNameEn}</p><p className="text-xs text-ink/50">{item.quantity} × {formatTnd(item.unitPriceMillimes, locale)}</p></div>
                  <strong className="text-sm tabular-nums">{formatTnd(item.lineTotalMillimes, locale)}</strong>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-2 border-t border-ink/10 pt-4 text-sm">
              <div className="flex justify-between text-ink/60"><dt>{french ? "Livraison" : "Delivery"}</dt><dd className="tabular-nums">{formatTnd(order.deliveryFeeMillimes, locale)}</dd></div>
              <div className="flex items-baseline justify-between"><dt className="font-semibold">Total</dt><dd className="font-display text-3xl font-medium tabular-nums">{formatTnd(order.totalMillimes, locale)}</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl bg-ivory p-5">
            <h3 className="label">{french ? "Livraison à" : "Delivering to"}</h3>
            <address className="mt-3 text-sm not-italic leading-6 text-ink/75">
              <strong className="text-ink">{order.customerFirstName} {order.customerLastName}</strong><br />
              {order.addressLine1}{order.addressLine2 ? <><br />{order.addressLine2}</> : null}<br />
              {order.postalCode} {order.city}<br />
              {order.governorate}<br />
              {order.phone}
            </address>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href={`/${locale}/montres`} className="btn-primary">{french ? "Continuer mes achats" : "Continue shopping"}</Link>
          <Link href={`/${locale}/contact`} className="btn-outline">{french ? "Une question ?" : "A question?"}</Link>
        </div>
      </div>
    </div>
  );
}
