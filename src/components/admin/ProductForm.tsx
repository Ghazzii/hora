import type { Category, Product, ProductImage, ProductVariant } from "@prisma/client";
import type { ReactNode } from "react";
import { saveProductAction } from "@/features/admin/actions";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { ImageManager } from "@/components/admin/ImageManager";

type FullProduct = Product & { images: ProductImage[]; variants: ProductVariant[] };

const SUGGESTIONS = {
  gender: ["Unisexe", "Homme", "Femme"],
  movement: ["Quartz", "Automatique", "Mécanique", "Solaire"],
  caseMaterial: ["Acier inoxydable", "Acier inoxydable 316L", "Acier PVD noir", "Titane", "Céramique"],
  strapMaterial: ["Cuir", "Acier", "Milanais", "Caoutchouc", "Nylon"],
  style: ["Classique", "Élégant", "Sport", "Prestige", "Minimaliste"],
  color: ["Noir", "Blanc", "Bleu", "Vert", "Ivoire", "Or", "Argent"],
  waterResistance: ["3 ATM", "5 ATM", "10 ATM", "20 ATM"],
} as const;

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="admin-card">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink/50">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-ink/[.08] p-4 transition hover:border-ink/20">
      <span><span className="block text-sm font-semibold">{label}</span><span className="text-xs text-ink/50">{hint}</span></span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span aria-hidden="true" className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-ink/15 transition after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-300 peer-checked:bg-ink peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-gold" />
    </label>
  );
}

export function ProductForm({ product, categories, uploadEnabled }: { product?: FullProduct | null; categories: Category[]; uploadEnabled: boolean }) {
  const variant = product?.variants[0];
  const spec = (name: keyof typeof SUGGESTIONS, label: string, fallback: string) => (
    <label>
      <span className="label">{label}</span>
      <input className="field mt-2" name={name} list={`suggest-${name}`} defaultValue={product?.[name] ?? fallback} maxLength={80} />
      <datalist id={`suggest-${name}`}>{SUGGESTIONS[name].map((value) => <option key={value} value={value} />)}</datalist>
    </label>
  );

  return (
    <ActionForm action={saveProductAction} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {product && <input type="hidden" name="productId" value={product.id} />}
      {variant && <input type="hidden" name="variantId" value={variant.id} />}

      <div className="space-y-6">
        <Section title="Essentials">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="label">Name (French) *</span><input className="field mt-2" name="nameFr" required minLength={2} maxLength={120} placeholder="e.g. Atlas Héritage" defaultValue={product?.nameFr} /></label>
            <label><span className="label">Name (English)</span><input className="field mt-2" name="nameEn" maxLength={120} placeholder="Same as French if empty" defaultValue={product?.nameEn} /></label>
            <label><span className="label">Brand</span><input className="field mt-2" name="brand" maxLength={80} defaultValue={product?.brand ?? "Hora"} /></label>
            <label className="sm:col-span-2"><span className="label">Category *</span>
              <select className="field mt-2" name="categoryId" required defaultValue={product?.categoryId ?? categories[0]?.id ?? ""}>
                {!categories.length && <option value="" disabled>No categories yet</option>}
                {categories.map((category) => <option key={category.id} value={category.id}>{category.nameFr}{category.active ? "" : " (hidden)"}</option>)}
              </select>
            </label>
          </div>
        </Section>

        <Section title="Photos" description={uploadEnabled ? "Upload from your computer or phone — large photos are resized automatically." : undefined}>
          <ImageManager initial={product?.images.map((image) => image.url) ?? []} uploadEnabled={uploadEnabled} />
        </Section>

        <Section title="Price & stock" description={product && product.variants.length > 1 ? "These prices apply to the first option. Edit other options below." : undefined}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="label">Price (DT) *</span><input className="field mt-2" name="priceDt" type="number" step="0.001" min="0" required inputMode="decimal" defaultValue={variant ? variant.priceMillimes / 1000 : ""} placeholder="249" /></label>
            <label><span className="label">Compare-at price (DT)</span><input className="field mt-2" name="compareAtDt" type="number" step="0.001" min="0" inputMode="decimal" defaultValue={variant?.compareAtPriceMillimes ? variant.compareAtPriceMillimes / 1000 : ""} placeholder="Shows a crossed-out price" /></label>
            {!product && <label><span className="label">Starting stock</span><input className="field mt-2" name="initialStock" type="number" min="0" step="1" required defaultValue="0" /></label>}
            <label><span className="label">Low-stock alert at</span><input className="field mt-2" name="lowStockThreshold" type="number" min="0" step="1" defaultValue={variant?.lowStockThreshold ?? 3} /></label>
          </div>
          {product && <p className="mt-3 text-xs text-ink/45">Stock is changed from the Inventory page so every movement is logged.</p>}
        </Section>

        <Section title="Description">
          <div className="grid gap-4">
            <label><span className="label">French</span><textarea className="field mt-2" name="descriptionFr" rows={4} maxLength={3000} defaultValue={product?.descriptionFr} placeholder="Une montre… (a short default is written if empty)" /></label>
            <label><span className="label">English</span><textarea className="field mt-2" name="descriptionEn" rows={4} maxLength={3000} defaultValue={product?.descriptionEn} placeholder="A watch… (a short default is written if empty)" /></label>
          </div>
        </Section>

        <Section title="Specifications" description="Shown on the product page and used by the catalog filters.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spec("gender", "For", "Unisexe")}
            {spec("movement", "Movement", "Quartz")}
            {spec("caseMaterial", "Case", "Acier inoxydable")}
            {spec("strapMaterial", "Strap", "Cuir")}
            {spec("color", "Dial colour", "Noir")}
            {spec("waterResistance", "Water resistance", "5 ATM")}
            {spec("style", "Style", "Classique")}
          </div>
        </Section>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
        <section className="admin-card space-y-3">
          <h2 className="font-display text-2xl font-medium">Visibility</h2>
          <Toggle name="active" label="Visible in store" hint="Hidden products can't be ordered." defaultChecked={product?.active ?? true} />
          <Toggle name="featured" label="Feature on home page" hint="Shown in “La sélection”." defaultChecked={product?.featured} />
          <SubmitButton className="btn-primary h-12 w-full" pendingLabel="Saving…">{product ? "Save changes" : "Create product"}</SubmitButton>
        </section>
        <details className="admin-card group">
          <summary className="cursor-pointer list-none font-display text-xl font-medium">Advanced <span className="float-right text-sm text-ink/40 transition group-open:rotate-180">⌄</span></summary>
          <div className="mt-4 grid gap-4">
            <label><span className="label">Reference / SKU</span><input className="field mt-2" name="sku" defaultValue={product?.sku} placeholder="Generated from the name" maxLength={60} /></label>
            <label><span className="label">URL slug (French)</span><input className="field mt-2" name="slugFr" defaultValue={product?.slugFr} placeholder="Generated from the name" maxLength={120} /></label>
            <label><span className="label">URL slug (English)</span><input className="field mt-2" name="slugEn" defaultValue={product?.slugEn} placeholder="Generated from the name" maxLength={120} /></label>
          </div>
        </details>
      </aside>
    </ActionForm>
  );
}
