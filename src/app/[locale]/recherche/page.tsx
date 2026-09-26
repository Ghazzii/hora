import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (query.q) redirect(`/${locale}/montres?q=${encodeURIComponent(query.q)}`);
  return (
    <div className="container section min-h-[45vh]">
      <p className="eyebrow">{locale === "fr" ? "Recherche" : "Search"}</p>
      <h1 className="heading-lg mt-3">{locale === "fr" ? "Que recherchez-vous ?" : "What are you looking for?"}</h1>
      <form className="mt-8 flex max-w-2xl gap-2">
        <label className="sr-only" htmlFor="site-search">{locale === "fr" ? "Rechercher une montre" : "Search watches"}</label>
        <input id="site-search" className="field" name="q" type="search" required minLength={2} maxLength={100} placeholder={locale === "fr" ? "Nom, collection, référence…" : "Name, collection, reference…"} />
        <button className="bg-ink px-6 font-bold text-white">{locale === "fr" ? "Chercher" : "Search"}</button>
      </form>
    </div>
  );
}
