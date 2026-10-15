import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale } from "@/lib/i18n";
import { formatTnd } from "@/lib/money";
import { statusLabel } from "@/lib/order-rules";
import { OrderProgress } from "@/components/site/OrderProgress";
import { optionLabel } from "@/lib/utils";

export default async function CustomerOrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const french = locale === "fr";
  const user = await requireUser(locale);
  const order = await db.order.findFirst({ where: { id, userId: user.id }, include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } } });
  if (!order) notFound();
  const dateFormat = new Intl.DateTimeFormat(french ? "fr-TN" : "en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="container section">
      <Link href={`/${locale}/compte`} className="text-xs font-semibold text-ink/55 hover:text-ink">← {french ? "Mes commandes" : "My orders"}</Link>
      <p className="eyebrow mt-6">{order.orderNumber}</p>
      <h1 className="heading-lg mt-3">{statusLabel(order.status, locale)}</h1>
      <p className="mt-3 text-sm text-ink/55">{french ? "Passée le" : "Placed on"} {dateFormat.format(order.createdAt)}</p>
      <div className="mt-10 max-w-3xl"><OrderProgress status={order.status} locale={locale} /></div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-soft sm:p-8">
          <h2 className="font-display text-2xl font-medium">{french ? "Articles" : "Items"}</h2>
          <ul className="mt-5 space-y-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">{item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />}</div>
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{french ? item.productNameFr : item.productNameEn}</p><p className="text-xs text-ink/50">{[optionLabel(french ? item.variantLabelFr : item.variantLabelEn), `${item.quantity} × ${formatTnd(item.unitPriceMillimes, locale)}`].filter(Boolean).join(" · ")}</p></div>
                <strong className="text-sm tabular-nums">{formatTnd(item.lineTotalMillimes, locale)}</strong>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between text-ink/60"><dt>{french ? "Sous-total" : "Subtotal"}</dt><dd className="tabular-nums">{formatTnd(order.subtotalMillimes, locale)}</dd></div>
            <div className="flex justify-between text-ink/60"><dt>{french ? "Livraison" : "Delivery"}</dt><dd className="tabular-nums">{formatTnd(order.deliveryFeeMillimes, locale)}</dd></div>
            <div className="flex items-baseline justify-between"><dt className="font-semibold">Total</dt><dd className="font-display text-3xl font-medium tabular-nums">{formatTnd(order.totalMillimes, locale)}</dd></div>
          </dl>
        </section>
        <section className="h-fit rounded-3xl bg-white p-6 shadow-soft sm:p-8">
          <h2 className="font-display text-2xl font-medium">{french ? "Livraison" : "Delivery"}</h2>
          <address className="mt-4 not-italic leading-7 text-ink/70">
            <strong className="text-ink">{order.customerFirstName} {order.customerLastName}</strong><br />
            {order.addressLine1}{order.addressLine2 ? <><br />{order.addressLine2}</> : null}<br />
            {order.postalCode} {order.city}, {order.governorate}<br />
            {order.phone}
          </address>
          <p className="mt-5 rounded-2xl bg-gold/10 px-4 py-3 text-sm text-ink/70">{order.paymentStatus === "PAID" ? (french ? "Payée à la livraison." : "Paid on delivery.") : french ? "Paiement au livreur à la réception." : "Payment to the courier on arrival."}</p>
        </section>
      </div>
    </div>
  );
}
