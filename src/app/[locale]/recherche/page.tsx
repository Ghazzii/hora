import { redirect } from "next/navigation";

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
        <input autoFocus className="field" name="q" required minLength={2} placeholder={locale === "fr" ? "Nom, collection, référence…" : "Name, collection, reference…"} />
        <button className="bg-ink px-6 font-bold text-white">{locale === "fr" ? "Chercher" : "Search"}</button>
      </form>
    </div>
  );
}
