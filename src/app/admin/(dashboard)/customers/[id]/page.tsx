import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { formatAdminDate } from "@/lib/dates";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ContactActions } from "@/components/admin/ContactActions";
import { OrderStatusBadge } from "@/components/admin/StatusBadge";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await db.user.findUnique({ where: { id }, include: { addresses: true, orders: { orderBy: { createdAt: "desc" } } } });
  if (!customer) notFound();
  const delivered = customer.orders.filter((order) => order.status === "DELIVERED").reduce((sum, order) => sum + order.totalMillimes, 0);
  return (
    <>
      <Link href="/admin/customers?view=accounts" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/55 hover:text-ink"><ArrowLeft size={14} /> Accounts</Link>
      <div className="mt-4"><AdminPageHeader eyebrow={`Customer since ${formatAdminDate(customer.createdAt)}`} title={`${customer.firstName} ${customer.lastName}`} description={`${customer.orders.length} order${customer.orders.length === 1 ? "" : "s"} · ${formatTnd(delivered, "en")} delivered`} /></div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="admin-card h-fit space-y-4">
          {customer.phone && <ContactActions phone={customer.phone} showNumber />}
          {customer.email && <a href={`mailto:${customer.email}`} className="block truncate text-sm text-ink/60 hover:text-ink">{customer.email}</a>}
          <div className="border-t border-ink/[.08] pt-4">
            <h2 className="label">Saved addresses</h2>
            {customer.addresses.length ? customer.addresses.map((address) => <address key={address.id} className="mt-3 text-sm not-italic leading-6 text-ink/70">{address.addressLine1}<br />{address.postalCode} {address.city}, {address.governorate}</address>) : <p className="mt-2 text-sm text-ink/45">None saved.</p>}
          </div>
        </aside>
        <section className="admin-card">
          <h2 className="font-display text-2xl font-medium">Order history</h2>
          {customer.orders.length ? (
            <ul className="mt-4 divide-y divide-ink/[.06]">
              {customer.orders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center gap-4 py-3">
                  <Link className="font-semibold hover:text-gold-dark" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                  <span className="text-sm text-ink/50">{formatAdminDate(order.createdAt)}</span>
                  <span className="ml-auto"><OrderStatusBadge status={order.status} /></span>
                  <span className="w-28 text-right font-semibold tabular-nums">{formatTnd(order.totalMillimes, "en")}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm text-ink/50">No orders yet.</p>}
        </section>
      </div>
    </>
  );
}
