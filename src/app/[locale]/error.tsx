"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale: string }>();
  const french = params.locale !== "en";
  return (
    <div className="container section flex min-h-[55vh] flex-col items-center justify-center text-center">
      <p className="eyebrow">Hora</p>
      <h1 className="heading-md mt-4">{french ? "Une erreur est survenue." : "Something went wrong."}</h1>
      <p className="mt-4 max-w-md text-ink/60">{french ? "Veuillez réessayer. Si le problème persiste, contactez Hora." : "Please try again. If the problem continues, contact Hora."}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-primary" onClick={reset}><RotateCcw size={16} /> {french ? "Réessayer" : "Try again"}</button>
        <Link href={`/${french ? "fr" : "en"}`} className="btn-outline">{french ? "Accueil" : "Home"}</Link>
      </div>
    </div>
  );
}
