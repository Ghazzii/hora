import { db } from "@/lib/db";
import { adjustInventoryAction } from "@/features/admin/actions";
import { Table, Td, Th } from "@/components/ui/Table";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ low?: string }> }) {
  const query = await searchParams;
  const variants = await db.productVariant.findMany({ where: { active: true, ...(query.low === "true" ? { stock: { lte: 4 } } : {}) }, include: { product: true, inventoryMovements: { include: { actor: true }, orderBy: { createdAt: "desc" }, take: 3 } }, orderBy: { stock: "asc" } });
  return (
    <>
      <p className="eyebrow">Stock control</p><div className="flex items-end justify-between"><h1 className="mt-2 font-display text-4xl">Inventory</h1><a href={query.low === "true" ? "/admin/inventory" : "/admin/inventory?low=true"} className="text-sm underline">{query.low === "true" ? "Show all" : "Low stock only"}</a></div>
      <div className="admin-card mt-7"><Table><thead><tr><Th>Variant</Th><Th>Stock</Th><Th>Recent movement</Th><Th>Adjustment</Th></tr></thead><tbody>{variants.map((variant) => <tr key={variant.id}><Td><strong>{variant.product.nameFr}</strong><br /><small>{variant.sku}</small></Td><Td className={variant.stock <= variant.lowStockThreshold ? "font-bold text-red-700" : "font-bold"}>{variant.stock}<br /><small>Threshold {variant.lowStockThreshold}</small></Td><Td>{variant.inventoryMovements[0] ? <><strong>{variant.inventoryMovements[0].delta > 0 ? "+" : ""}{variant.inventoryMovements[0].delta}</strong> · {variant.inventoryMovements[0].reason}<br /><small>{variant.inventoryMovements[0].note}</small></> : "—"}</Td><Td><form action={adjustInventoryAction} className="flex min-w-[320px] gap-2"><input type="hidden" name="variantId" value={variant.id} /><input className="field w-20" name="delta" type="number" required placeholder="+/-" /><input className="field" name="note" required minLength={3} placeholder="Required reason" /><button className="bg-ink px-3 font-bold text-white">Apply</button></form></Td></tr>)}</tbody></Table></div>
    </>
  );
}
