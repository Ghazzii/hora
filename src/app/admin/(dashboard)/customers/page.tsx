import Link from "next/link";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { Table, Td, Th } from "@/components/ui/Table";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = await searchParams;
  const customers = await db.user.findMany({ where: { role: "CUSTOMER", ...(query.q ? { OR: [{ email: { contains: query.q, mode: "insensitive" } }, { phone: { contains: query.q } }, { firstName: { contains: query.q, mode: "insensitive" } }, { lastName: { contains: query.q, mode: "insensitive" } }] } : {}) }, include: { orders: { select: { totalMillimes: true, status: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return <><p className="eyebrow">Relationships</p><h1 className="mt-2 font-display text-4xl">Customers</h1><form className="mt-6 flex max-w-xl gap-2"><input className="field" name="q" defaultValue={query.q} placeholder="Name, email or phone" /><button className="bg-ink px-5 font-bold text-white">Search</button></form><div className="admin-card mt-6"><Table><thead><tr><Th>Customer</Th><Th>Phone</Th><Th>Orders</Th><Th>Delivered spend</Th><Th>Since</Th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><Td><Link className="font-bold underline" href={`/admin/customers/${customer.id}`}>{customer.firstName} {customer.lastName}</Link><br /><small>{customer.email}</small></Td><Td>{customer.phone}</Td><Td>{customer.orders.length}</Td><Td>{formatTnd(customer.orders.filter((order) => order.status === "DELIVERED").reduce((sum, order) => sum + order.totalMillimes, 0))}</Td><Td>{customer.createdAt.toLocaleDateString("fr-TN")}</Td></tr>)}</tbody></Table></div></>;
}
