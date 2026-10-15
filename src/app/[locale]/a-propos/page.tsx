import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InfoPage } from "@/components/site/InfoPage";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const french = locale === "fr";
  const details = [
    { image: "hora-packaging.webp", label: french ? "La signature HORA" : "The HORA signature", alt: french ? "Emblème HORA doré sur un écrin noir" : "Gold HORA emblem on a black presentation box" },
    { image: "hora-crown.webp", label: french ? "Le sens du détail" : "An eye for detail", alt: french ? "Gros plan de la couronne gravée de l’emblème HORA" : "Close-up of a crown engraved with the HORA emblem" },
    { image: "hora-dial.webp", label: "Time. Redefined.", alt: french ? "Cadran noir et aiguilles dorées avec l’emblème HORA" : "Black dial and gold hands with the HORA emblem" },
  ];

  return (
    <InfoPage eyebrow="Hora — Time. Redefined." title={french ? "Une maison tunisienne contemporaine" : "A contemporary Tunisian watch house"}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
        <Image src="/images/brand/hora-signature.webp" alt="HORA — Time. Redefined." fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain p-6" />
      </div>
      <p>{french ? "Du bracelet bijou au cadran sportif, Hora sélectionne des montres pour accompagner les jours qui comptent. Notre signature associe des lignes précises, le noir et l’or : une expression sobre du temps qui vous appartient." : "From jewellery bracelets to sporty dials, Hora selects watches for the days that matter. Our signature brings together precise lines, black and gold: a quiet expression of the time that is yours."}</p>
      <div className="grid grid-cols-3 gap-3">
        {details.map(({ image, label, alt }) => (
          <figure key={image}>
            <Image src={`/images/brand/${image}`} alt={alt} width={image === "hora-dial.webp" ? 283 : image === "hora-crown.webp" ? 298 : 297} height={208} sizes="(max-width: 1024px) 30vw, 18vw" className="aspect-[3/2] w-full rounded-lg object-cover" />
            <figcaption className="mt-3 text-[10px] uppercase tracking-[.08em] text-ink/55 sm:text-xs">{label}</figcaption>
          </figure>
        ))}
      </div>
      <p>{french ? "Chaque commande est suivie par notre équipe, de l’appel de confirmation jusqu’à votre porte. Nous livrons partout en Tunisie, avec un paiement à la réception." : "Our team follows every order, from the confirmation call to your door. We deliver throughout Tunisia, with payment on arrival."}</p>
      <Link href={`/${locale}/montres`} className="link-underline text-sm">{french ? "Découvrir la collection" : "Shop the collection"} <ArrowRight size={16} /></Link>
    </InfoPage>
  );
}
