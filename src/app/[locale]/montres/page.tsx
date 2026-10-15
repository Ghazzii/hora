import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import {
  ActiveFilters,
  CatalogProvider,
  CatalogResults,
  FilterForm,
  MobileFilters,
  SortSelect,
  type CatalogFacets,
  type CatalogState,
} from "@/components/catalog/CatalogControls";
import { getCatalog, getCatalogFacets } from "@/lib/products";
import { isLocale } from "@/lib/i18n";
import { genderLabel } from "@/lib/product-labels";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const french = locale === "fr";
  return {
    title: french ? "Toutes les montres" : "All watches",
    alternates: {
      canonical: `/${locale}/montres`,
      languages: { fr: "/fr/montres", en: "/en/montres" },
    },
  };
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function priceFilter(value: string | undefined) {
  if (!value || !/^\d{1,7}(?:\.\d{1,3})?$/.test(value)) return undefined;
  const millimes = Math.round(Number(value) * 1000);
  return Number.isSafeInteger(millimes) ? millimes : undefined;
}

/** Page numbers with gaps: 1 … 4 5 6 … 12 */
function pageWindow(current: number, count: number) {
  const pages = new Set([1, count, current - 1, current, current + 1].filter((page) => page >= 1 && page <= count));
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1]! > 1) result.push("gap");
    result.push(page);
  });
  return result;
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
  const french = locale === "fr";
  const search = valueOf(query.q)?.trim().slice(0, 100);
  const brand = valueOf(query.brand);
  const gender = valueOf(query.gender);
  const requestedSort = valueOf(query.sort);
  const sort = requestedSort === "rating" || requestedSort === "price-asc" || requestedSort === "price-desc" ? requestedSort : "newest";
  const page = Number(valueOf(query.page) ?? 1);
  const minPrice = priceFilter(valueOf(query.minPrice));
  const maxPrice = priceFilter(valueOf(query.maxPrice));
  const available = valueOf(query.available) === "true";
  const data = await Promise.all([
    getCatalog({ search, brand, gender, sort, page, minPrice, maxPrice, available }),
    getCatalogFacets(),
  ]).catch(() => null);

  if (!data) {
    return (
      <div className="container section min-h-[50vh]">
        <p className="eyebrow">Hora</p>
        <h1 className="heading-lg mt-3">{french ? "Collection indisponible" : "Collection unavailable"}</h1>
        <p role="status" className="mt-5 max-w-xl text-ink/65">{french ? "Nous ne pouvons pas afficher les montres pour le moment. Réessayez bientôt." : "We cannot display watches right now. Please try again soon."}</p>
        <Link href={`/${locale}`} className="link-underline mt-7">{french ? "Retour à l’accueil" : "Back to home"}</Link>
      </div>
    );
  }
  const [catalog, rawFacets] = data;

  const facets: CatalogFacets = {
    brands: rawFacets.brands,
    genders: rawFacets.genders,
  };
  const state: CatalogState = {
    q: search || undefined,
    brand, gender,
    minPrice: minPrice !== undefined ? valueOf(query.minPrice) : undefined,
    maxPrice: maxPrice !== undefined ? valueOf(query.maxPrice) : undefined,
    available: available ? "true" : undefined,
    sort,
  };
  const chipLabels = {
    q: search ? `« ${search} »` : undefined,
    gender: gender ? genderLabel(gender, locale) : undefined,
    minPrice: state.minPrice ? `≥ ${state.minPrice} DT` : undefined,
    maxPrice: state.maxPrice ? `≤ ${state.maxPrice} DT` : undefined,
    available: french ? "En stock" : "In stock",
  };

  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, raw] of Object.entries(query)) {
      const value = valueOf(raw);
      if (value && ["q", "brand", "gender", "minPrice", "maxPrice", "available", "sort"].includes(key)) params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    const encoded = params.toString();
    return `/${locale}/montres${encoded ? `?${encoded}` : ""}`;
  };

  return (
    <CatalogProvider state={state}>
      <div className="container pb-8 pt-10 sm:pt-16">
        <p className="eyebrow animate-fade-up">{french ? "Collection" : "Collection"}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="heading-lg animate-fade-up [animation-delay:80ms]">
            {search ? (french ? "Résultats" : "Results") : (french ? "Toutes les montres" : "All watches")}
          </h1>
          <p className="animate-fade-up text-sm text-ink/55 [animation-delay:160ms]" aria-live="polite">
            {catalog.total} {french ? (catalog.total > 1 ? "modèles" : "modèle") : catalog.total === 1 ? "model" : "models"}
          </p>
        </div>
      </div>

      <div className="sticky-below-header sticky z-30 border-y border-ink/10 bg-ivory/90 backdrop-blur-xl">
        <div className="container flex min-h-16 flex-wrap items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <MobileFilters locale={locale} facets={facets} />
            <div className="hidden lg:block"><ActiveFilters locale={locale} labels={chipLabels} /></div>
          </div>
          <SortSelect locale={locale} />
        </div>
      </div>

      <div className="container grid gap-10 py-8 lg:grid-cols-[260px_1fr] lg:py-10">
        <aside className="hidden lg:block">
          <div className="no-scrollbar sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto pb-6 pr-1">
            <FilterForm locale={locale} facets={facets} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 lg:hidden"><ActiveFilters locale={locale} labels={chipLabels} /></div>
          <CatalogResults>
            {catalog.items.length ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 xl:grid-cols-3 xl:gap-x-7 xl:gap-y-14">
                {catalog.items.map((product, index) => (
                  <Reveal key={product.id} delay={(index % 3) * 80}>
                    <ProductCard product={product} locale={locale} priority={index < 4} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-ink/15 px-6 py-20 text-center">
                <h2 className="font-display text-3xl font-medium">{french ? "Aucune montre ne correspond" : "No watches match"}</h2>
                <p className="mt-3 text-ink/60">{french ? "Essayez d'élargir vos filtres ou votre recherche." : "Try widening your filters or search."}</p>
                <Link href={`/${locale}/montres`} className="btn-primary mt-7">{french ? "Voir toutes les montres" : "View all watches"}</Link>
              </div>
            )}
          </CatalogResults>

          {catalog.pageCount > 1 && (
            <nav className="mt-16 flex items-center justify-center gap-1.5" aria-label="Pagination">
              <PageLink href={catalog.page > 1 ? pageHref(catalog.page - 1) : undefined} label={french ? "Page précédente" : "Previous page"}><ChevronLeft size={18} /></PageLink>
              {pageWindow(catalog.page, catalog.pageCount).map((item, index) =>
                item === "gap" ? (
                  <span key={`gap-${index}`} className="px-1 text-ink/35">…</span>
                ) : (
                  <Link
                    key={item}
                    href={pageHref(item)}
                    aria-current={item === catalog.page ? "page" : undefined}
                    className={cn(
                      "grid h-11 min-w-11 place-items-center rounded-full px-2 text-sm font-semibold tabular-nums transition",
                      item === catalog.page ? "bg-ink text-white" : "hover:bg-ink/[.06]",
                    )}
                  >
                    {item}
                  </Link>
                ),
              )}
              <PageLink href={catalog.page < catalog.pageCount ? pageHref(catalog.page + 1) : undefined} label={french ? "Page suivante" : "Next page"}><ChevronRight size={18} /></PageLink>
            </nav>
          )}
        </div>
      </div>
    </CatalogProvider>
  );
}

function PageLink({ href, label, children }: { href?: string; label: string; children: React.ReactNode }) {
  const className = "grid h-11 w-11 place-items-center rounded-full border border-ink/15 transition";
  if (!href) return <span className={cn(className, "opacity-30")} aria-hidden="true">{children}</span>;
  return <Link href={href} className={cn(className, "hover:border-ink hover:bg-ink hover:text-white")} aria-label={label}>{children}</Link>;
}
