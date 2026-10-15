import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/dates";
import { adjustInventoryAction } from "@/features/admin/actions";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { cn } from "@/lib/utils";

export const metadata = { title: "Inventory" };

const REASON_LABEL: Record<string, string> = {
  ORDER_PLACED: "Order",
  ORDER_CANCELLED: "Cancelled order",
  ORDER_RETURNED: "Return",
  ADMIN_ADJUSTMENT: "Adjustment",
  SEED: "Initial",
};

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string; view?: string; low?: string }> }) {
  const query = await searchParams;
  const view = query.view ?? (query.low === "true" ? "low" : "all");
  const q = query.q?.trim().slice(0, 100);
  const where: Prisma.ProductVariantWhereInput = {
    active: true,
    ...(view === "out" ? { stock: 0 } : {}),
    ...(q ? { OR: [{ sku: { contains: q, mode: "insensitive" } }, { product: { nameFr: { contains: q, mode: "insensitive" } } }] } : {}),
  };
  const all = await db.productVariant.findMany({
    where,
    include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } }, inventoryMovements: { include: { actor: true }, orderBy: { createdAt: "desc" }, take: 3 } },
    orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
    take: 300,
  });
  const variants = view === "low" ? all.filter((variant) => variant.stock <= variant.lowStockThreshold) : all;
  const tabs = [["all", "All"], ["low", "Low stock"], ["out", "Sold out"]] as const;
  const units = all.reduce((sum, variant) => sum + variant.stock, 0);

  return (
    <>
      <AdminPageHeader eyebrow="Stock control" title="Inventory" description={`${units} units across ${all.length} active option${all.length === 1 ? "" : "s"}. Every change is logged with a reason.`} />
      <datalist id="inventory-reasons">
        {["Restock from supplier", "Stock count correction", "Damaged", "Gift / sample", "Customer exchange"].map((reason) => <option key={reason} value={reason} />)}
      </datalist>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {tabs.map(([value, label]) => (
            <Link key={value} href={`/admin/inventory?${new URLSearchParams({ view: value, ...(q ? { q } : {}) })}`} className={cn("inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition", view === value ? "bg-ink text-white" : "bg-white text-ink/70 hover:text-ink")}>{label}</Link>
          ))}
        </div>
        <Form action="/admin/inventory" className="relative ml-auto w-full max-w-sm">
          <input type="hidden" name="view" value={view} />
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <label className="sr-only" htmlFor="inventory-search">Search inventory</label>
          <input id="inventory-search" className="field h-10 pl-10" name="q" type="search" defaultValue={q} placeholder="Product or SKU" />
        </Form>
      </div>

      {variants.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-ink/15 bg-white/50 px-6 py-16 text-center text-ink/55">{view === "all" ? "No active options found." : "Nothing here — stock levels look healthy."}</div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {variants.map((variant) => {
            const level = variant.stock === 0 ? "out" : variant.stock <= variant.lowStockThreshold ? "low" : "ok";
            const last = variant.inventoryMovements[0];
            return (
              <li key={variant.id} className="admin-card grid gap-4 p-4 lg:grid-cols-[minmax(0,1.2fr)_140px_minmax(0,1fr)_minmax(320px,1.1fr)] lg:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-sand">{variant.product.images[0] && <Image src={variant.product.images[0].url} alt="" fill sizes="44px" className="object-cover" />}</div>
                  <div className="min-w-0">
                    <Link href={`/admin/products/${variant.productId}`} className="block truncate font-semibold hover:text-gold-dark">{variant.product.nameFr}</Link>
                    <p className="truncate text-xs text-ink/50">{variant.labelFr} · {variant.sku}</p>
                  </div>
                </div>
                <div>
                  <p className="flex items-baseline gap-1.5"><span className={cn("text-2xl font-semibold", level === "out" ? "text-red-700" : level === "low" ? "text-amber-800" : "")}>{variant.stock}</span><span className="text-xs text-ink/45">in stock</span></p>
                  <p className="text-[11px] text-ink/40">Alert at {variant.lowStockThreshold}</p>
                </div>
                <div className="min-w-0 text-xs text-ink/55">
                  {last ? (
                    <>
                      <p><strong className={cn("tabular-nums", last.delta > 0 ? "text-emerald-800" : "text-ink")}>{last.delta > 0 ? "+" : ""}{last.delta}</strong> · {REASON_LABEL[last.reason] ?? last.reason} · {timeAgo(last.createdAt)}</p>
                      <p className="truncate text-ink/40">{last.note}{last.actor ? ` — ${last.actor.firstName}` : ""}</p>
                    </>
                  ) : <p className="text-ink/40">No movements yet</p>}
                </div>
                <ActionForm action={adjustInventoryAction} resetOnSuccess className="flex gap-2">
                  <input type="hidden" name="variantId" value={variant.id} />
                  <label className="w-20 shrink-0"><span className="sr-only">Change in units for {variant.sku}</span><input className="field h-10 px-3 text-center" name="delta" type="number" step="1" required placeholder="+/−" /></label>
                  <label className="min-w-0 flex-1"><span className="sr-only">Reason</span><input className="field h-10" name="note" required minLength={3} maxLength={500} list="inventory-reasons" placeholder="Reason" /></label>
                  <SubmitButton className="btn-primary h-10 px-4 text-xs">Apply</SubmitButton>
                </ActionForm>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
