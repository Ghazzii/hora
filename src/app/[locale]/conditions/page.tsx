import { InfoPage } from "@/components/site/InfoPage";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const french = locale === "fr";
  return <InfoPage eyebrow={french ? "Informations" : "Information"} title={french ? "Conditions de vente" : "Terms of sale"}>
    <div><h2 className="font-display text-2xl text-ink">{french ? "Commandes" : "Orders"}</h2><p className="mt-2">{french ? "Les articles et les frais de livraison sont récapitulés avant l’envoi de votre commande. Nous vérifions le stock et enregistrons la commande, puis notre équipe vous appelle pour la confirmer." : "Items and delivery charges are shown before you place an order. We check stock and record the order, then our team calls to confirm it."}</p></div>
    <div><h2 className="font-display text-2xl text-ink">{french ? "Paiement" : "Payment"}</h2><p className="mt-2">{french ? "Le paiement s’effectue à la livraison. Aucun paiement en ligne n’est demandé sur ce site." : "Payment is made on delivery. This site does not request online payment."}</p></div>
    <p className="rounded-xl border border-gold/40 bg-gold/10 p-5 text-sm">{french ? "L’identité légale du vendeur, les garanties et les modalités détaillées de retour doivent être publiées avant l’ouverture commerciale de la boutique." : "The seller’s legal identity, warranties, and full return terms must be published before the store opens for business."}</p>
  </InfoPage>;
}
