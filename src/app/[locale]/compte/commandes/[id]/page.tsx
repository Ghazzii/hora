import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isLocale } from "@/lib/i18n";
import { formatTnd } from "@/lib/money";
import { statusLabel } from "@/lib/order-rules";

export default async function CustomerOrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale);
  const order = await db.order.findFirst({ where: { id, userId: user.id }, include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } } });
  if (!order) notFound();
  return <div className="container section"><p className="eyebrow">{order.orderNumber}</p><h1 className="heading-lg mt-3">{statusLabel(order.status, locale)}</h1><div className="mt-8 grid gap-8 lg:grid-cols-2"><section className="admin-card"><h2 className="font-display text-2xl">{locale === "fr" ? "Articles" : "Items"}</h2><ul className="mt-4 divide-y divide-black/10">{order.items.map((item) => <li key={item.id} className="flex justify-between gap-3 py-3"><span>{item.quantity} × {locale === "fr" ? item.productNameFr : item.productNameEn}</span><strong>{formatTnd(item.lineTotalMillimes, locale)}</strong></li>)}</ul><p className="mt-4 flex justify-between text-lg font-bold"><span>Total</span><span>{formatTnd(order.totalMillimes, locale)}</span></p></section><section className="admin-card"><h2 className="font-display text-2xl">{locale === "fr" ? "Livraison" : "Delivery"}</h2><address className="mt-4 not-italic leading-7 text-black/65">{order.customerFirstName} {order.customerLastName}<br />{order.addressLine1}<br />{order.postalCode} {order.city}, {order.governorate}<br />{order.phone}</address></section></div></div>;
}
