import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getOrderByAccessToken } from "@/lib/orders";
import { formatTnd } from "@/lib/money";
import { isLocale } from "@/lib/i18n";
import { TrackOrder } from "@/components/site/TrackView";

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
  return (
    <div className="container section">
      <TrackOrder orderId={order.id} orderNumber={order.orderNumber} valueMillimes={order.totalMillimes} />
      <div className="mx-auto max-w-2xl border border-black/10 bg-white p-6 text-center shadow-luxury sm:p-10">
        <CheckCircle2 className="mx-auto text-gold-dark" size={54} />
        <p className="eyebrow mt-5">{order.orderNumber}</p>
        <h1 className="mt-3 font-display text-4xl">{locale === "fr" ? "Commande bien reçue" : "Order received"}</h1>
        <p className="mt-5 leading-7 text-black/65">{locale === "fr" ? "L'équipe Hora vous appellera pour confirmer l'adresse et les articles. Vous paierez le montant ci-dessous au moment de la livraison." : "The Hora team will call to confirm the address and items. You will pay the amount below when the package is delivered."}</p>
        <ul className="mt-7 divide-y divide-black/10 border-y border-black/10 text-left">
          {order.items.map((item) => <li key={item.id} className="flex justify-between gap-4 py-4"><span>{item.quantity} × {locale === "fr" ? item.productNameFr : item.productNameEn}</span><strong>{formatTnd(item.lineTotalMillimes, locale)}</strong></li>)}
        </ul>
        <div className="mt-5 flex justify-between text-lg font-bold"><span>Total</span><span>{formatTnd(order.totalMillimes, locale)}</span></div>
        <Link href={`/${locale}/montres`} className="mt-8 inline-flex bg-ink px-7 py-3 font-bold text-white">{locale === "fr" ? "Continuer mes achats" : "Continue shopping"}</Link>
      </div>
    </div>
  );
}
