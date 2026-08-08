import Link from "next/link";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";

export default async function AdminDashboard() {
  const [orderCount, productCount, customerCount, revenue, recentOrders, lowStock] = await Promise.all([
    db.order.count(),
    db.product.count({ where: { active: true } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.order.aggregate({ where: { status: "DELIVERED" }, _sum: { totalMillimes: true } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.productVariant.findMany({ where: { active: true, stock: { lte: 4 } }, include: { product: true }, orderBy: { stock: "asc" }, take: 8 }),
  ]);
  const cards = [
    ["Orders", String(orderCount)],
    ["Delivered revenue", formatTnd(revenue._sum.totalMillimes ?? 0)],
    ["Active products", String(productCount)],
    ["Customers", String(customerCount)],
  ];
  return (
    <>
      <p className="eyebrow">Overview</p><h1 className="mt-2 font-display text-4xl">Dashboard</h1>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="admin-card"><p className="text-xs uppercase tracking-wider text-black/50">{label}</p><p className="mt-3 font-display text-3xl">{value}</p></div>)}</div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
        <section className="admin-card"><div className="flex items-center justify-between"><h2 className="font-display text-2xl">Recent orders</h2><Link href="/admin/orders" className="text-sm underline">View all</Link></div><Table className="mt-4"><thead><tr><Th>Order</Th><Th>Customer</Th><Th>Status</Th><Th>Total</Th></tr></thead><tbody>{recentOrders.map((order) => <tr key={order.id}><Td><Link className="font-semibold underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></Td><Td>{order.customerFirstName} {order.customerLastName}</Td><Td><Badge>{order.status}</Badge></Td><Td>{formatTnd(order.totalMillimes)}</Td></tr>)}</tbody></Table></section>
        <section className="admin-card"><div className="flex items-center justify-between"><h2 className="font-display text-2xl">Low stock</h2><Link href="/admin/inventory" className="text-sm underline">Inventory</Link></div><ul className="mt-4 divide-y divide-black/10">{lowStock.map((variant) => <li key={variant.id} className="flex justify-between gap-3 py-3 text-sm"><span>{variant.product.nameFr}<br /><small className="text-black/50">{variant.sku}</small></span><strong className={variant.stock === 0 ? "text-red-700" : ""}>{variant.stock}</strong></li>)}</ul></section>
      </div>
    </>
  );
}
