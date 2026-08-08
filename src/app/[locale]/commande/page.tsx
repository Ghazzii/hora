import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { isLocale } from "@/lib/i18n";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className="container section">
      <p className="eyebrow">{locale === "fr" ? "Paiement à la livraison" : "Cash on delivery"}</p>
      <h1 className="heading-lg mt-3">{locale === "fr" ? "Finaliser la commande" : "Complete your order"}</h1>
      <div className="mt-10"><CheckoutForm locale={locale} /></div>
    </div>
  );
}
