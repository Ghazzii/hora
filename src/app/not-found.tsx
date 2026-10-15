import Link from "next/link";
import { headers } from "next/headers";

export default async function NotFound() {
  const french = (await headers()).get("x-hora-locale") !== "en";
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ivory p-6 text-center">
      <svg aria-hidden="true" viewBox="0 0 200 200" className="absolute h-[80vmin] w-[80vmin] text-ink/[.05]">
        <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="1.5" />
        {Array.from({ length: 12 }, (_, index) => (
          <rect key={index} x="99" y="10" width="2" height="10" fill="currentColor" transform={`rotate(${index * 30} 100 100)`} />
        ))}
        <path d="M100 100V45M100 100l38 22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div className="relative">
        <p className="eyebrow">404</p>
        <h1 className="heading-lg mt-4 animate-fade-up">{french ? "Le temps s'est arrêté ici." : "Time stopped here."}</h1>
        <p className="mt-4 animate-fade-up text-ink/60 [animation-delay:80ms]">{french ? "Cette page n'existe pas ou n'est plus disponible." : "This page doesn't exist or is no longer available."}</p>
        <div className="mt-8 flex animate-fade-up flex-wrap justify-center gap-3 [animation-delay:160ms]">
          <Link href={french ? "/fr" : "/en"} className="btn-primary">{french ? "Retour à Hora" : "Back to Hora"}</Link>
          <Link href={french ? "/fr/montres" : "/en/montres"} className="btn-outline">{french ? "Voir les montres" : "Browse watches"}</Link>
        </div>
      </div>
    </main>
  );
}
