import Link from "next/link";
import { InfoPage } from "@/components/site/InfoPage";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const french = locale === "fr";
  return <InfoPage eyebrow={french ? "Service" : "Service"} title={french ? "Livraison & retours" : "Delivery & returns"}>
    <div><h2 className="font-display text-2xl text-ink">{french ? "Livraison en Tunisie" : "Delivery in Tunisia"}</h2><p className="mt-2">{french ? "Nous livrons dans les 24 gouvernorats. La livraison est offerte dès 100 DT d'achat ; en dessous, un tarif fixe de 8 DT s'applique, affiché avant la confirmation de la commande." : "We deliver to all 24 governorates. Delivery is free on orders from 100 DT; below that, a flat 8 DT fee applies, shown before you place the order."}</p></div>
    <div><h2 className="font-display text-2xl text-ink">{french ? "Confirmation et paiement" : "Confirmation and payment"}</h2><p className="mt-2">{french ? "L’équipe Hora confirme chaque commande par téléphone. Le règlement s’effectue à la livraison, sans paiement en ligne." : "The Hora team confirms every order by phone. Payment is collected on delivery; there is no online payment."}</p></div>
    <div><h2 className="font-display text-2xl text-ink">{french ? "Une question sur une livraison ou un retour ?" : "A delivery or return question?"}</h2><p className="mt-2">{french ? "Conservez votre numéro de commande et contactez-nous pour connaître les modalités applicables à votre commande." : "Keep your order number and contact us for the details that apply to your order."} <Link href={`/${locale}/contact`} className="font-semibold underline underline-offset-4">{french ? "Nous contacter" : "Contact us"}</Link>.</p></div>
  </InfoPage>;
}
