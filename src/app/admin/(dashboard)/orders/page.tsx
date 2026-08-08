import Link from "next/link";
import { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; source?: string }> }) {
  const query = await searchParams;
  const where: Prisma.OrderWhereInput = {
    ...(query.q ? { OR: [{ orderNumber: { contains: query.q, mode: "insensitive" } }, { phone: { contains: query.q } }, { customerFirstName: { contains: query.q, mode: "insensitive" } }, { customerLastName: { contains: query.q, mode: "insensitive" } }] } : {}),
    ...(query.status && Object.values(OrderStatus).includes(query.status as OrderStatus) ? { status: query.status as OrderStatus } : {}),
    ...(query.source ? { source: query.source } : {}),
  };
  const orders = await db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <p className="eyebrow">Operations</p><h1 className="mt-2 font-display text-4xl">Orders</h1>
      <form className="mt-6 grid gap-3 rounded-sm bg-white p-4 sm:grid-cols-4"><input className="field" name="q" defaultValue={query.q} placeholder="Order, customer or phone" /><select className="field" name="status" defaultValue={query.status ?? ""}><option value="">All statuses</option>{Object.values(OrderStatus).map((status) => <option key={status}>{status}</option>)}</select><input className="field" name="source" defaultValue={query.source} placeholder="Source" /><button className="bg-ink font-bold text-white">Filter</button></form>
      <div className="admin-card mt-6"><Table><thead><tr><Th>Order</Th><Th>Date</Th><Th>Customer</Th><Th>Source</Th><Th>Status</Th><Th>Total</Th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><Td><Link className="font-bold underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></Td><Td>{order.createdAt.toLocaleDateString("fr-TN")}</Td><Td>{order.customerFirstName} {order.customerLastName}<br /><small>{order.phone}</small></Td><Td>{order.source ?? "direct"}<br /><small>{order.campaign}</small></Td><Td><Badge>{order.status}</Badge></Td><Td>{formatTnd(order.totalMillimes)}</Td></tr>)}</tbody></Table></div>
    </>
  );
}
