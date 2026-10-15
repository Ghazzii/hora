import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { storageConfigured } from "@/lib/storage";
import { addVariantAction, deleteProductAction, updateVariantAction } from "@/features/admin/actions";
import { deleteQuestion } from "@/lib/admin-products";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { ProductForm } from "@/components/admin/ProductForm";
import { cn } from "@/lib/utils";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [product, categories, sold] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { createdAt: "asc" } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.orderItem.aggregate({ where: { productId: id, order: { status: { notIn: ["CANCELLED", "RETURNED"] } } }, _sum: { quantity: true } }),
  ]);
  const orderLines = product ? await db.orderItem.count({ where: { productId: id } }) : 0;
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/55 hover:text-ink"><ArrowLeft size={14} /> All products</Link>
      <div className="mt-4">
        <AdminPageHeader
          eyebrow={`Catalog · ${product.sku}`}
          title={product.nameFr}
          description={`${sold._sum.quantity ?? 0} sold · ${product.variants.reduce((sum, item) => sum + item.stock, 0)} in stock`}
          actions={product.active ? <Link href={`/fr/montres/${product.slugFr}`} target="_blank" className="btn-outline h-10 px-4 text-xs">View in store <ExternalLink size={13} /></Link> : <span className="rounded-full bg-ink/[.06] px-3 py-1.5 text-xs font-semibold text-ink/60">Hidden from store</span>}
        />
      </div>
      {query.created && (
        <p className="mt-6 flex animate-fade-in items-center gap-2 rounded-2xl bg-emerald-50 px-5 py-3 text-sm text-emerald-900"><CheckCircle2 size={17} /> Product created. Add more photos, options or details below.</p>
      )}
      {product.sheetManaged && (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-amber-50 px-5 py-3 text-sm text-amber-950"><FileSpreadsheet size={17} /> This watch comes from Google Sheets. Edit names, prices and options in the sheet — changes made here are replaced at the next product sync. Stock is always managed here, and so are photos while its “Images” cell in the sheet is empty.</p>
      )}
      <div className="mt-7"><ProductForm product={product} categories={categories} uploadEnabled={storageConfigured()} /></div>

      <section className="admin-card mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-medium">Options</h2>
            <p className="mt-1 text-sm text-ink/50">Straps, sizes or colours, each with its own price and stock. Stock changes are made from <Link href="/admin/inventory" className="underline">Inventory</Link>.</p>
          </div>
        </div>
        <ul className="mt-5 divide-y divide-ink/[.06]">
          {product.variants.map((variant) => (
            <li key={variant.id} className="py-4">
              <ActionForm action={updateVariantAction} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_140px_auto_auto]">
                <input type="hidden" name="variantId" value={variant.id} />
                <label><span className="label">Label (FR)</span><input className="field mt-1.5 h-10" name="labelFr" defaultValue={variant.labelFr} required minLength={2} maxLength={100} /></label>
                <label><span className="label">Label (EN)</span><input className="field mt-1.5 h-10" name="labelEn" defaultValue={variant.labelEn} maxLength={100} /></label>
                <label><span className="label">Price (DT)</span><input className="field mt-1.5 h-10" name="priceDt" type="number" step="0.001" min="0" defaultValue={variant.priceMillimes / 1000} required /></label>
                <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={variant.active} className="h-4 w-4 accent-ink" /> Active</label>
                <SubmitButton className="btn-outline h-10 px-4 text-xs">Save</SubmitButton>
              </ActionForm>
              <p className="mt-2 text-xs text-ink/45">
                {variant.sku} · <span className={cn(variant.stock <= variant.lowStockThreshold && "font-semibold text-amber-800")}>{variant.stock} in stock</span>
                {variant.compareAtPriceMillimes ? ` · was ${formatTnd(variant.compareAtPriceMillimes, "en")}` : ""}
              </p>
            </li>
          ))}
        </ul>
        <details className="mt-4 rounded-2xl bg-ivory p-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold"><Plus size={16} /> Add an option</summary>
          <ActionForm action={addVariantAction} resetOnSuccess className="mt-4 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_130px_110px_auto]">
            <input type="hidden" name="productId" value={product.id} />
            <label><span className="label">Label (FR) *</span><input className="field mt-1.5 h-10" name="labelFr" required minLength={2} maxLength={100} placeholder="Bracelet acier" /></label>
            <label><span className="label">Label (EN)</span><input className="field mt-1.5 h-10" name="labelEn" maxLength={100} placeholder="Steel bracelet" /></label>
            <label><span className="label">Price (DT) *</span><input className="field mt-1.5 h-10" name="priceDt" type="number" step="0.001" min="0" required defaultValue={product.variants[0] ? product.variants[0].priceMillimes / 1000 : ""} /></label>
            <label><span className="label">Stock</span><input className="field mt-1.5 h-10" name="stock" type="number" min="0" step="1" defaultValue="0" /></label>
            <SubmitButton className="btn-primary h-10 px-5 text-xs">Add option</SubmitButton>
          </ActionForm>
        </details>
      </section>

      <section className="admin-card mt-6 border border-red-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-medium text-red-800">Delete this product</h2>
            <p className="mt-1 text-sm text-ink/55">
              Permanently removes it with its options, photo list, reviews and stock history.
              {orderLines > 0 ? ` It appears in ${orderLines} past order line${orderLines > 1 ? "s" : ""}; those orders keep their own copy of the name, price and photo.` : " It has never been ordered."}
              {" "}To only take it off the store, switch off “Visible in store” instead.
            </p>
          </div>
          <ActionForm action={deleteProductAction} confirm={deleteQuestion(product.nameFr, orderLines)}>
            <input type="hidden" name="productId" value={product.id} />
            <SubmitButton className="btn h-11 border border-red-200 bg-white px-5 text-sm text-red-700 hover:bg-red-600 hover:text-white" pendingLabel="Deleting…"><Trash2 size={15} /> Delete product</SubmitButton>
          </ActionForm>
        </div>
      </section>
    </>
  );
}
