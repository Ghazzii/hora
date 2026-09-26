"use client";

import { useParams } from "next/navigation";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale: string }>();
  const french = params.locale !== "en";
  return <div className="container section min-h-[45vh] text-center"><h1 className="heading-lg">{french ? "Une erreur est survenue." : "Something went wrong."}</h1><p className="mt-4 text-black/60">{french ? "Veuillez réessayer. Si le problème persiste, contactez Hora." : "Please try again. If the problem continues, contact Hora."}</p><button type="button" className="mt-7 bg-ink px-7 py-3 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" onClick={reset}>{french ? "Réessayer" : "Try again"}</button></div>;
}
