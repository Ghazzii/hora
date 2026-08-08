import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { Table, Td, Th } from "@/components/ui/Table";

export default async function AnalyticsPage() {
  const orders = await db.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 2000 });
  const delivered = orders.filter((order) => order.status === "DELIVERED");
  const revenue = delivered.reduce((sum, order) => sum + order.totalMillimes, 0);
  const sources = new Map<string, { orders: number; revenue: number }>();
  const products = new Map<string, { quantity: number; revenue: number }>();
  for (const order of orders) {
    const source = order.source ?? "direct";
    const current = sources.get(source) ?? { orders: 0, revenue: 0 };
    current.orders += 1;
    if (order.status === "DELIVERED") current.revenue += order.totalMillimes;
    sources.set(source, current);
    for (const item of order.items) {
      const product = products.get(item.productNameFr) ?? { quantity: 0, revenue: 0 };
      product.quantity += item.quantity;
      product.revenue += item.lineTotalMillimes;
      products.set(item.productNameFr, product);
    }
  }
  const aov = delivered.length ? Math.round(revenue / delivered.length) : 0;
  return <><p className="eyebrow">Store analytics</p><h1 className="mt-2 font-display text-4xl">Commerce performance</h1><p className="mt-3 text-sm text-black/55">These figures come from Hora orders, not general website traffic.</p><div className="mt-7 grid gap-4 sm:grid-cols-3"><div className="admin-card"><p className="text-xs text-black/50">Delivered revenue</p><p className="mt-2 font-display text-3xl">{formatTnd(revenue)}</p></div><div className="admin-card"><p className="text-xs text-black/50">Orders</p><p className="mt-2 font-display text-3xl">{orders.length}</p></div><div className="admin-card"><p className="text-xs text-black/50">Average delivered order</p><p className="mt-2 font-display text-3xl">{formatTnd(aov)}</p></div></div><div className="mt-6 grid gap-6 xl:grid-cols-2"><section className="admin-card"><h2 className="font-display text-2xl">Sources</h2><Table className="mt-4"><thead><tr><Th>Source</Th><Th>Orders</Th><Th>Delivered revenue</Th></tr></thead><tbody>{[...sources.entries()].sort((a,b) => b[1].orders-a[1].orders).map(([source,data]) => <tr key={source}><Td>{source}</Td><Td>{data.orders}</Td><Td>{formatTnd(data.revenue)}</Td></tr>)}</tbody></Table></section><section className="admin-card"><h2 className="font-display text-2xl">Top products</h2><Table className="mt-4"><thead><tr><Th>Product</Th><Th>Units</Th><Th>Gross item value</Th></tr></thead><tbody>{[...products.entries()].sort((a,b) => b[1].quantity-a[1].quantity).slice(0,10).map(([name,data]) => <tr key={name}><Td>{name}</Td><Td>{data.quantity}</Td><Td>{formatTnd(data.revenue)}</Td></tr>)}</tbody></Table></section></div></>;
}
