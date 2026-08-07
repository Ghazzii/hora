import Link from "next/link";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { Table, Td, Th } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { toggleProductAction } from "@/features/admin/actions";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  const products = await db.product.findMany({ where: query.q ? { OR: [{ nameFr: { contains: query.q, mode: "insensitive" } }, { sku: { contains: query.q, mode: "insensitive" } }] } : {}, include: { category: true, variants: { orderBy: { priceMillimes: "asc" } } }, orderBy: { updatedAt: "desc" }, take: 100 });
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Catalog</p><h1 className="mt-2 font-display text-4xl">Products</h1></div><Link href="/admin/products/new" className="bg-ink px-5 py-3 font-bold text-white">New product</Link></div>
      <form className="mt-6 flex max-w-xl gap-2"><input className="field" name="q" defaultValue={query.q} placeholder="Name or SKU" /><button className="bg-ink px-5 font-bold text-white">Search</button></form>
      <div className="admin-card mt-6"><Table><thead><tr><Th>Product</Th><Th>Category</Th><Th>Price</Th><Th>Stock</Th><Th>Status</Th><Th>Action</Th></tr></thead><tbody>{products.map((product) => { const stock = product.variants.reduce((sum, item) => sum + item.stock, 0); return <tr key={product.id}><Td><Link className="font-bold underline" href={`/admin/products/${product.id}`}>{product.nameFr}</Link><br /><small>{product.sku}</small></Td><Td>{product.category.nameFr}</Td><Td>{product.variants[0] ? formatTnd(product.variants[0].priceMillimes) : "—"}</Td><Td>{stock}</Td><Td><Badge>{product.active ? "ACTIVE" : "INACTIVE"}</Badge></Td><Td><form action={toggleProductAction}><input type="hidden" name="productId" value={product.id} /><input type="hidden" name="active" value={String(!product.active)} /><button className="text-xs underline">{product.active ? "Deactivate" : "Activate"}</button></form></Td></tr>; })}</tbody></Table></div>
    </>
  );
}
