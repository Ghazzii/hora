import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { CheckCircle2, ExternalLink, Plus, Search, Star, Trash2 } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { deleteProductAction, toggleProductAction } from "@/features/admin/actions";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { cn } from "@/lib/utils";
import { deleteQuestion } from "@/lib/admin-products";
import { sheetsConfigured } from "@/lib/google-sheets";
import { productSheetUrl, productTabName } from "@/lib/product-sheet";
import { ProductSheetSync } from "@/components/admin/ProductSheetSync";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; show?: string; deleted?: string }> }) {
  const query = await searchParams;
  const q = query.q?.trim().slice(0, 100);
  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ nameFr: { contains: q, mode: "insensitive" } }, { nameEn: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { brand: { contains: q, mode: "insensitive" } }] } : {}),
    ...(query.show === "hidden" ? { active: false } : query.show === "visible" ? { active: true } : {}),
  };
  const products = await db.product.findMany({
    where,
    include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: { orderBy: { priceMillimes: "asc" } }, _count: { select: { orderItems: true } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  const tabs = [["", "All"], ["visible", "Visible"], ["hidden", "Hidden"]] as const;

  return (
    <>
      <AdminPageHeader eyebrow="Catalog" title="Products" description={`${products.length} product${products.length === 1 ? "" : "s"}`} actions={<Link href="/admin/products/new" className="btn-primary h-11"><Plus size={16} /> New product</Link>} />
      <Link href="/admin/products/photo-review" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-gold-dark">Review the Hora photo collection <ExternalLink size={14} /></Link>
      {sheetsConfigured() && (
        <ProductSheetSync tabName={productTabName()} spreadsheetUrl={await productSheetUrl()} />
      )}
      {query.deleted && (
        <p className="mt-6 flex animate-fade-in items-center gap-2 rounded-2xl bg-emerald-50 px-5 py-3 text-sm text-emerald-900"><CheckCircle2 size={17} /> “{query.deleted.slice(0, 120)}” was deleted.</p>
      )}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {tabs.map(([value, label]) => (
            <Link key={label} href={`/admin/products${value || q ? `?${new URLSearchParams({ ...(value ? { show: value } : {}), ...(q ? { q } : {}) })}` : ""}`} className={cn("inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition", (query.show ?? "") === value ? "bg-ink text-white" : "bg-white text-ink/70 hover:text-ink")}>{label}</Link>
          ))}
        </div>
        <Form action="/admin/products" className="relative ml-auto w-full max-w-sm">
          {query.show && <input type="hidden" name="show" value={query.show} />}
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <label className="sr-only" htmlFor="product-search">Search products</label>
          <input id="product-search" className="field h-10 pl-10" name="q" type="search" defaultValue={q} placeholder="Name, SKU or brand" />
        </Form>
      </div>

      {products.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-ink/15 bg-white/50 px-6 py-16 text-center">
          <p className="text-ink/60">{q ? "No products match your search." : "No products yet."}</p>
          <Link href="/admin/products/new" className="btn-primary mt-6"><Plus size={16} /> Add your first watch</Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {products.map((product) => {
            const stock = product.variants.reduce((sum, item) => sum + item.stock, 0);
            const low = product.variants.some((item) => item.active && item.stock <= item.lowStockThreshold);
            const prices = [...new Set(product.variants.map((item) => item.priceMillimes))];
            return (
              <li key={product.id} className={cn("admin-card flex flex-wrap items-center gap-4 p-3 pr-5 transition hover:shadow-lift sm:flex-nowrap", !product.active && "opacity-70")}>
                <Link href={`/admin/products/${product.id}`} className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                  {product.images[0] && <Image src={product.images[0].url} alt="" fill sizes="64px" className="object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${product.id}`} className="flex items-center gap-2 font-semibold hover:text-gold-dark">
                    <span className="truncate">{product.nameFr}</span>
                    {product.featured && <Star size={13} className="shrink-0 fill-gold text-gold" aria-label="Featured" />}
                  </Link>
                  <p className="truncate text-xs text-ink/50">{product.sku} · {product.category.nameFr} · {product.variants.length} option{product.variants.length > 1 ? "s" : ""}</p>
                </div>
                <div className="w-28 text-right text-sm font-semibold tabular-nums">{prices.length ? (prices.length > 1 ? `${formatTnd(prices[0]!, "en")}+` : formatTnd(prices[0]!, "en")) : "—"}</div>
                <div className="w-24 text-right">
                  <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", stock === 0 ? "bg-red-50 text-red-800" : low ? "bg-amber-50 text-amber-900" : "bg-ink/[.05] text-ink/70")}>{stock} in stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <ActionForm action={toggleProductAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="active" value={String(!product.active)} />
                    <SubmitButton className={cn("inline-flex h-8 w-24 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition", product.active ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100" : "bg-ink/[.06] text-ink/60 hover:bg-ink/10")} aria-label={product.active ? `Hide ${product.nameFr} from the store` : `Show ${product.nameFr} in the store`}>
                      {product.active ? "Visible" : "Hidden"}
                    </SubmitButton>
                  </ActionForm>
                  {product.active && <Link href={`/fr/montres/${product.slugFr}`} target="_blank" className="grid h-8 w-8 place-items-center rounded-full text-ink/40 transition hover:bg-ink/[.06] hover:text-ink" aria-label="View in store"><ExternalLink size={14} /></Link>}
                  <ActionForm action={deleteProductAction} confirm={deleteQuestion(product.nameFr, product._count.orderItems)}>
                    <input type="hidden" name="productId" value={product.id} />
                    <SubmitButton className="grid h-8 w-8 place-items-center rounded-full text-ink/35 transition hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${product.nameFr}`}><Trash2 size={14} /></SubmitButton>
                  </ActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
