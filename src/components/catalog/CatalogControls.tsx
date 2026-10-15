"use client";

import { createContext, useCallback, useContext, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { genderLabel } from "@/lib/product-labels";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";

export type CatalogState = {
  q?: string;
  brand?: string;
  gender?: string;
  minPrice?: string;
  maxPrice?: string;
  available?: string;
  sort?: string;
};

export type CatalogFacets = {
  brands: string[];
  genders: string[];
};

const FILTER_KEYS = ["brand", "gender", "minPrice", "maxPrice", "available"] as const;

type CatalogContextValue = {
  pending: boolean;
  state: CatalogState;
  navigate: (next: CatalogState) => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("Catalog controls must be inside CatalogProvider");
  return context;
}

export function CatalogProvider({ state, children }: { state: CatalogState; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback(
    (next: CatalogState) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(next)) {
        if (value && !(key === "sort" && value === "newest")) params.set(key, value);
      }
      const query = params.toString();
      startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }));
    },
    [pathname, router],
  );
  return <CatalogContext.Provider value={{ pending, state, navigate }}>{children}</CatalogContext.Provider>;
}

/** Dims results while a new filter combination loads. */
export function CatalogResults({ children }: { children: ReactNode }) {
  const { pending } = useCatalog();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-300", pending && "pointer-events-none opacity-40")}>
      {children}
    </div>
  );
}

function formState(form: HTMLFormElement, base: CatalogState): CatalogState {
  const data = new FormData(form);
  const next: CatalogState = { q: base.q, sort: base.sort };
  for (const key of FILTER_KEYS) {
    const value = String(data.get(key) ?? "").trim();
    if (value) next[key] = value;
  }
  return next;
}

function PillGroup({ name, legend, options, value, allLabel }: { name: string; legend: string; options: { value: string; label: string }[]; value?: string; allLabel: string }) {
  if (!options.length) return null;
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {[{ value: "", label: allLabel }, ...options].map((option) => (
          <label key={option.value || "all"} className="cursor-pointer">
            <input type="radio" name={name} value={option.value} defaultChecked={(value ?? "") === option.value} className="peer sr-only" />
            <span className="inline-flex h-9 items-center rounded-full border border-ink/15 bg-white px-4 text-[13px] font-medium transition hover:border-ink/40 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FilterForm({ locale, facets, onApplied, instant = true }: { locale: Locale; facets: CatalogFacets; onApplied?: () => void; instant?: boolean }) {
  const { state, navigate } = useCatalog();
  const french = locale === "fr";
  const apply = (form: HTMLFormElement) => {
    navigate(formState(form, state));
    onApplied?.();
  };
  return (
    <form
      key={JSON.stringify(state)}
      className="space-y-7"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        apply(event.currentTarget);
      }}
      onChange={(event) => {
        const target = event.target as HTMLInputElement;
        if (instant && target.type !== "number") apply(event.currentTarget);
      }}
    >
      <PillGroup name="gender" legend={french ? "Pour" : "For"} options={facets.genders.map((item) => ({ value: item, label: genderLabel(item, locale) }))} value={state.gender} allLabel={french ? "Tous" : "All"} />
      {facets.brands.length > 1 && <PillGroup name="brand" legend={french ? "Marque" : "Brand"} options={facets.brands.map((item) => ({ value: item, label: item }))} value={state.brand} allLabel={french ? "Toutes" : "All"} />}
      <fieldset>
        <legend className="label">{french ? "Prix (DT)" : "Price (DT)"}</legend>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <input className="field h-10" type="number" min="0" step="1" inputMode="numeric" name="minPrice" defaultValue={state.minPrice} aria-label={french ? "Prix minimum en dinars" : "Minimum price in dinars"} placeholder="Min" />
          <span className="text-ink/30">—</span>
          <input className="field h-10" type="number" min="0" step="1" inputMode="numeric" name="maxPrice" defaultValue={state.maxPrice} aria-label={french ? "Prix maximum en dinars" : "Maximum price in dinars"} placeholder="Max" />
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="text-sm font-semibold">{french ? "En stock uniquement" : "In stock only"}</span>
        <input type="checkbox" name="available" value="true" defaultChecked={state.available === "true"} className="peer sr-only" />
        <span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-ink/15 transition after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-300 after:ease-spring peer-checked:bg-ink peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-gold" />
      </label>
      <button type="submit" className="btn-primary w-full">{french ? "Voir les résultats" : "Show results"}</button>
    </form>
  );
}

export function MobileFilters({ locale, facets }: { locale: Locale; facets: CatalogFacets }) {
  const { state } = useCatalog();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const french = locale === "fr";
  const active = FILTER_KEYS.filter((key) => state[key]).length;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-outline h-11 px-5 lg:hidden">
        <SlidersHorizontal size={16} /> {french ? "Filtres" : "Filters"}
        {active > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] text-white">{active}</span>}
      </button>
      <Sheet open={open} onClose={close} side="left" label={french ? "Filtres" : "Filters"} closeLabel={french ? "Fermer les filtres" : "Close filters"}>
        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-6">
          <h2 className="font-display text-3xl font-medium">{french ? "Filtres" : "Filters"}</h2>
          <div className="mt-8"><FilterForm locale={locale} facets={facets} instant={false} onApplied={close} /></div>
        </div>
      </Sheet>
    </>
  );
}

export function SortSelect({ locale }: { locale: Locale }) {
  const { state, navigate } = useCatalog();
  const french = locale === "fr";
  return (
    <label className="relative">
      <span className="sr-only">{french ? "Trier par" : "Sort by"}</span>
      <select
        className="field h-11 w-auto min-w-44 rounded-full"
        value={state.sort ?? "newest"}
        onChange={(event) => navigate({ ...state, sort: event.target.value })}
      >
        <option value="newest">{french ? "Nouveautés" : "Newest"}</option>
        <option value="rating">{french ? "Mieux notées" : "Top rated"}</option>
        <option value="price-asc">{french ? "Prix croissant" : "Price: low to high"}</option>
        <option value="price-desc">{french ? "Prix décroissant" : "Price: high to low"}</option>
      </select>
    </label>
  );
}

export function ActiveFilters({ locale, labels }: { locale: Locale; labels: Partial<Record<keyof CatalogState, string>> }) {
  const { state, navigate } = useCatalog();
  const french = locale === "fr";
  const chips = (["q", ...FILTER_KEYS] as const).filter((key) => state[key]);
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => navigate({ ...state, [key]: undefined })}
          className="inline-flex h-8 animate-scale-in items-center gap-1.5 rounded-full bg-ink/[.06] pl-3 pr-2 text-xs font-semibold transition hover:bg-ink hover:text-white"
          aria-label={french ? `Retirer le filtre ${labels[key] ?? state[key]}` : `Remove filter ${labels[key] ?? state[key]}`}
        >
          {labels[key] ?? state[key]} <X size={13} />
        </button>
      ))}
      <button type="button" onClick={() => navigate({ sort: state.sort })} className="ml-1 text-xs font-semibold text-ink/55 underline-offset-4 hover:text-ink hover:underline">
        {french ? "Tout effacer" : "Clear all"}
      </button>
    </div>
  );
}
