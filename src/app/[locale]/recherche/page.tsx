import { redirect } from "next/navigation";
import Form from "next/form";
import type { Metadata } from "next";
import { ArrowRight, Search } from "lucide-react";

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
  const french = locale === "fr";
  return (
    <div className="container section min-h-[55vh]">
      <p className="eyebrow animate-fade-up">{french ? "Recherche" : "Search"}</p>
      <h1 className="heading-lg mt-3 animate-fade-up [animation-delay:80ms]">{french ? "Que recherchez-vous ?" : "What are you looking for?"}</h1>
      <Form action={`/${locale}/montres`} className="mt-10 flex max-w-3xl animate-fade-up items-center gap-3 border-b-2 border-ink pb-3 [animation-delay:160ms]">
        <Search size={24} className="shrink-0 text-ink/40" />
        <label className="sr-only" htmlFor="site-search">{french ? "Rechercher une montre" : "Search watches"}</label>
        <input id="site-search" autoFocus className="min-w-0 flex-1 bg-transparent font-display text-3xl outline-none placeholder:text-ink/25 sm:text-4xl" name="q" type="search" required minLength={2} maxLength={100} placeholder={french ? "Nom, marque, référence…" : "Name, brand, reference…"} />
        <button className="btn-primary h-11 shrink-0 px-5" aria-label={french ? "Chercher" : "Search"}><ArrowRight size={18} /></button>
      </Form>
    </div>
  );
}
