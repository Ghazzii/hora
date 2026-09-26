import { InfoPage } from "@/components/site/InfoPage";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const french = locale === "fr";
  return <InfoPage eyebrow={french ? "Informations" : "Information"} title={french ? "Confidentialité" : "Privacy"}>
    <div><h2 className="font-display text-2xl text-ink">{french ? "Données de commande" : "Order information"}</h2><p className="mt-2">{french ? "Nous utilisons les coordonnées et l’adresse que vous fournissez pour confirmer, préparer et livrer votre commande. Un compte est facultatif pour commander." : "We use the contact and address details you provide to confirm, prepare, and deliver your order. An account is optional."}</p></div>
    <div><h2 className="font-display text-2xl text-ink">{french ? "Compte et navigation" : "Account and browsing"}</h2><p className="mt-2">{french ? "Si vous créez un compte, Hora conserve les informations nécessaires à sa connexion et à l’historique des commandes. Le panier et les favoris sont enregistrés dans votre navigateur. Les paramètres de campagne, lorsqu’ils sont présents, servent à attribuer la provenance d’une visite." : "If you create an account, Hora stores information needed for sign-in and order history. Your cart and wishlist are stored in your browser. Campaign parameters, when present, help us attribute where a visit came from."}</p></div>
    <p className="rounded-xl border border-gold/40 bg-gold/10 p-5 text-sm">{french ? "L’identité du responsable de traitement, les durées de conservation et les modalités d’exercice de vos droits doivent être publiées avant l’ouverture commerciale." : "The data controller’s identity, retention periods, and how to exercise your rights must be published before the store opens for business."}</p>
  </InfoPage>;
}
