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
  const french = locale === "fr";
  const steps = french ? ["Panier", "Livraison", "Confirmation"] : ["Cart", "Delivery", "Confirmation"];
  return (
    <div className="container pb-16 pt-8 sm:pt-12">
      <ol className="flex items-center gap-2 text-xs font-semibold text-ink/40" aria-label={french ? "Étapes" : "Steps"}>
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true" className="h-px w-6 bg-ink/20 sm:w-10" />}
            <span className={index === 1 ? "text-ink" : index === 0 ? "text-ink/60" : undefined} aria-current={index === 1 ? "step" : undefined}>{step}</span>
          </li>
        ))}
      </ol>
      <p className="eyebrow mt-8 animate-fade-up">{french ? "Paiement à la livraison" : "Cash on delivery"}</p>
      <h1 className="heading-lg mt-3 animate-fade-up [animation-delay:80ms]">{french ? "Finaliser la commande" : "Complete your order"}</h1>
      <div className="mt-10 animate-fade-up [animation-delay:160ms]"><CheckoutForm locale={locale} /></div>
    </div>
  );
}
