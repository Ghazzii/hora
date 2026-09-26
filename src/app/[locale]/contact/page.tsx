import Link from "next/link";
import { InfoPage } from "@/components/site/InfoPage";
import { publicEnv } from "@/lib/env";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const french = locale === "fr";
  return (
    <InfoPage eyebrow="Hora" title={french ? "Nous contacter" : "Contact us"}>
      <p>{french ? "Une question sur une montre ou une commande ? Gardez votre numéro de commande à portée de main afin que nous puissions vous aider plus rapidement." : "Have a question about a watch or an order? Keep your order number nearby so we can help you more quickly."}</p>
      {(publicEnv.contactEmail || publicEnv.contactPhone) ? (
        <div className="grid gap-5 rounded-xl border border-black/10 bg-white p-6 sm:grid-cols-2">
          {publicEnv.contactEmail && <div><h2 className="text-sm font-bold text-ink">Email</h2><a className="underline underline-offset-4" href={`mailto:${publicEnv.contactEmail}`}>{publicEnv.contactEmail}</a></div>}
          {publicEnv.contactPhone && <div><h2 className="text-sm font-bold text-ink">{french ? "Téléphone" : "Phone"}</h2><a className="underline underline-offset-4" href={`tel:${publicEnv.contactPhone.replace(/[^+\d]/g, "")}`}>{publicEnv.contactPhone}</a></div>}
        </div>
      ) : <p className="rounded-xl border border-gold/40 bg-gold/10 p-5">{french ? "Les coordonnées directes de Hora seront affichées ici dès leur publication. Si notre équipe vous a appelé pour confirmer une commande, vous pouvez répondre à ce numéro." : "Hora's direct contact details will appear here once published. If our team called to confirm an order, you can reply to that number."}</p>}
      <p>{french ? "Vous avez un compte ?" : "Have an account?"} <Link href={`/${locale}/compte`} className="font-semibold underline underline-offset-4">{french ? "Consultez vos commandes" : "View your orders"}</Link>.</p>
    </InfoPage>
  );
}
