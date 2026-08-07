import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/site/ProductCard";
import { getCatalog, getCatalogFacets } from "@/lib/products";
import { isLocale } from "@/lib/i18n";

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const search = valueOf(query.q);
  const category = valueOf(query.category);
  const brand = valueOf(query.brand);
  const gender = valueOf(query.gender);
  const movement = valueOf(query.movement);
  const sort = valueOf(query.sort) as "newest" | "rating" | "price-asc" | "price-desc" | undefined;
  const page = Number(valueOf(query.page) ?? 1);
  const minPrice = Number(valueOf(query.minPrice) ?? 0) * 1000 || undefined;
  const maxPrice = Number(valueOf(query.maxPrice) ?? 0) * 1000 || undefined;
  const [catalog, facets] = await Promise.all([
    getCatalog({
      search,
      category,
      brand,
      gender,
      movement,
      sort,
      page,
      minPrice,
      maxPrice,
      available: valueOf(query.available) === "true",
    }),
    getCatalogFacets(),
  ]);

  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, raw] of Object.entries(query)) {
      const value = valueOf(raw);
      if (value && key !== "page") params.set(key, value);
    }
    params.set("page", String(target));
    return `/${locale}/montres?${params.toString()}`;
  };

  return (
    <div className="container section">
      <p className="eyebrow">{locale === "fr" ? "Collection" : "Collection"}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="heading-lg">{locale === "fr" ? "Toutes les montres" : "All watches"}</h1>
        <p className="text-sm text-black/55">{catalog.total} {locale === "fr" ? "modèles" : "models"}</p>
      </div>
      <details className="mt-8 border-y border-black/10 py-4" open>
        <summary className="cursor-pointer text-sm font-bold">{locale === "fr" ? "Recherche et filtres" : "Search and filters"}</summary>
        <form className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <input className="field" name="q" defaultValue={search} placeholder={locale === "fr" ? "Rechercher" : "Search"} />
          <select className="field" name="category" defaultValue={category ?? ""}>
            <option value="">{locale === "fr" ? "Toutes catégories" : "All categories"}</option>
            {facets.categories.map((item) => <option key={item.id} value={locale === "fr" ? item.slugFr : item.slugEn}>{locale === "fr" ? item.nameFr : item.nameEn}</option>)}
          </select>
          <select className="field" name="brand" defaultValue={brand ?? ""}>
            <option value="">{locale === "fr" ? "Toutes marques" : "All brands"}</option>
            {facets.brands.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="field" name="gender" defaultValue={gender ?? ""}>
            <option value="">{locale === "fr" ? "Tous genres" : "All genders"}</option>
            {facets.genders.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="field" name="movement" defaultValue={movement ?? ""}>
            <option value="">{locale === "fr" ? "Tous mouvements" : "All movements"}</option>
            {facets.movements.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="field" name="sort" defaultValue={sort ?? "newest"}>
            <option value="newest">{locale === "fr" ? "Nouveautés" : "Newest"}</option>
            <option value="rating">{locale === "fr" ? "Mieux notées" : "Top rated"}</option>
            <option value="price-asc">{locale === "fr" ? "Prix croissant" : "Price low to high"}</option>
            <option value="price-desc">{locale === "fr" ? "Prix décroissant" : "Price high to low"}</option>
          </select>
          <input className="field" type="number" min="0" name="minPrice" defaultValue={valueOf(query.minPrice)} placeholder={locale === "fr" ? "Prix min DT" : "Min price DT"} />
          <input className="field" type="number" min="0" name="maxPrice" defaultValue={valueOf(query.maxPrice)} placeholder={locale === "fr" ? "Prix max DT" : "Max price DT"} />
          <label className="flex h-11 items-center gap-2 border border-black/15 bg-white px-3 text-sm">
            <input type="checkbox" name="available" value="true" defaultChecked={valueOf(query.available) === "true"} />
            {locale === "fr" ? "En stock" : "In stock"}
          </label>
          <button className="h-11 bg-ink px-5 text-sm font-bold text-white">{locale === "fr" ? "Appliquer" : "Apply"}</button>
          <Link href={`/${locale}/montres`} className="grid h-11 place-items-center border border-black/20 text-sm font-semibold">{locale === "fr" ? "Effacer" : "Clear"}</Link>
        </form>
      </details>

      {catalog.items.length ? (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 xl:grid-cols-4 lg:gap-x-7">
          {catalog.items.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}
        </div>
      ) : (
        <div className="my-20 text-center"><h2 className="font-display text-3xl">{locale === "fr" ? "Aucun résultat" : "No results"}</h2><p className="mt-3 text-black/60">{locale === "fr" ? "Essayez de modifier vos filtres." : "Try changing your filters."}</p></div>
      )}

      {catalog.pageCount > 1 && (
        <nav className="mt-12 flex justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: catalog.pageCount }, (_, index) => index + 1).map((item) => (
            <Link key={item} href={pageHref(item)} aria-current={item === catalog.page ? "page" : undefined} className={item === catalog.page ? "grid h-10 w-10 place-items-center bg-ink text-white" : "grid h-10 w-10 place-items-center border border-black/20"}>{item}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
