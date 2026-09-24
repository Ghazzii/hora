import Link from "next/link";
import { ArrowUpRight, PackageOpen, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

export default async function AdminDashboard() {
  const now = new Date();
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
  const [orders, productCount, customerCount, lowStock] = await Promise.all([
    db.order.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, orderBy: { createdAt: "desc" }, take: 500 }),
    db.product.count({ where: { active: true } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.productVariant.findMany({ where: { active: true, stock: { lte: 4 } }, include: { product: true }, orderBy: { stock: "asc" }, take: 8 }),
  ]);
  const delivered = orders.filter((order) => order.status === "DELIVERED");
  const activePipeline = orders.filter((order) => !["DELIVERED", "CANCELLED", "RETURNED"].includes(order.status));
  const revenue = delivered.reduce((sum, order) => sum + order.totalMillimes, 0);
  const pipelineValue = activePipeline.reduce((sum, order) => sum + order.totalMillimes, 0);
  const resolved = orders.filter((order) => ["DELIVERED", "CANCELLED", "RETURNED"].includes(order.status));
  const deliveryRate = resolved.length ? Math.round((delivered.length / resolved.length) * 100) : 0;
  const revenueByDay = new Map<string, number>();
  for (let offset = 6; offset >= 0; offset -= 1) { const date = new Date(now); date.setDate(now.getDate() - offset); revenueByDay.set(dayKey(date), 0); }
  delivered.forEach((order) => { const key = dayKey(order.createdAt); if (revenueByDay.has(key)) revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + order.totalMillimes); });
  const chart = [...revenueByDay.entries()].map(([date, value]) => ({ date, value }));
  const chartMax = Math.max(...chart.map((item) => item.value), 1);
  const cards = [
    ["Delivered sales", formatTnd(revenue), "Last 30 days", TrendingUp],
    ["Active pipeline", formatTnd(pipelineValue), `${activePipeline.length} orders to process`, ShoppingBag],
    ["Delivery rate", `${deliveryRate}%`, "Of resolved orders", ArrowUpRight],
    ["New orders", String(orders.filter((order) => order.createdAt >= sevenDaysAgo).length), "Last 7 days", Users],
  ] as const;
  return <>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Sales command center</p><h1 className="mt-2 font-display text-4xl sm:text-5xl">Good morning, Hora.</h1><p className="mt-3 text-sm text-black/55">A live view of the last 30 days of store activity.</p></div><Link href="/admin/orders" className="inline-flex h-11 items-center gap-2 bg-ink px-5 text-sm font-bold text-white hover:bg-gold-dark">Manage orders <ArrowUpRight size={16} /></Link></div>
    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, detail, Icon]) => <article key={label} className="admin-card overflow-hidden"><div className="flex items-start justify-between"><p className="text-xs font-bold uppercase tracking-[.14em] text-black/45">{label}</p><Icon size={18} className="text-gold-dark" /></div><p className="mt-5 font-display text-3xl">{value}</p><p className="mt-2 text-xs text-black/50">{detail}</p></article>)}</section>
    <section className="admin-card mt-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-gold-dark">Revenue rhythm</p><h2 className="mt-1 font-display text-2xl">Delivered sales, last 7 days</h2></div><span className="text-xs text-black/45">Cash collected on delivery</span></div><div className="mt-8 flex h-44 items-end gap-3 sm:gap-5" aria-label="Delivered sales chart">{chart.map(({ date, value }) => <div key={date} className="flex h-full flex-1 flex-col justify-end gap-2"><div className="min-h-1 rounded-t bg-gold transition hover:bg-gold-dark" style={{ height: `${Math.max(3, (value / chartMax) * 100)}%` }} title={formatTnd(value)} /><span className="text-center text-[10px] text-black/45">{new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "short" })}</span></div>)}</div></section>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.55fr]"><section className="admin-card"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-gold-dark">Operations</p><h2 className="mt-1 font-display text-2xl">Latest orders</h2></div><Link href="/admin/orders" className="text-sm font-semibold underline">View all</Link></div><Table className="mt-5"><thead><tr><Th>Order</Th><Th>Customer</Th><Th>Status</Th><Th>Total</Th></tr></thead><tbody>{orders.slice(0, 8).length ? orders.slice(0, 8).map((order) => <tr key={order.id}><Td><Link className="font-semibold underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></Td><Td>{order.customerFirstName} {order.customerLastName}</Td><Td><Badge>{order.status}</Badge></Td><Td>{formatTnd(order.totalMillimes)}</Td></tr>) : <tr><Td colSpan={4}><span className="text-black/50">No orders yet. Seed the demo database or start selling.</span></Td></tr>}</tbody></Table></section><section className="admin-card"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-gold-dark">Inventory</p><h2 className="mt-1 font-display text-2xl">Needs attention</h2></div><PackageOpen size={20} className="text-gold-dark" /></div><ul className="mt-4 divide-y divide-black/10">{lowStock.length ? lowStock.map((variant) => <li key={variant.id} className="flex justify-between gap-3 py-3 text-sm"><span>{variant.product.nameFr}<br /><small className="text-black/50">{variant.sku}</small></span><strong className={variant.stock === 0 ? "text-red-700" : "text-gold-dark"}>{variant.stock} left</strong></li>) : <li className="py-4 text-sm text-black/50">All active variants are comfortably stocked.</li>}</ul><Link href="/admin/inventory" className="mt-5 inline-block text-sm font-semibold underline">Open inventory</Link><div className="mt-7 border-t border-black/10 pt-5 text-sm"><span className="text-black/50">Active products</span><strong className="float-right">{productCount}</strong><br /><span className="text-black/50">Customers</span><strong className="float-right">{customerCount}</strong></div></section></div>
  </>;
}
