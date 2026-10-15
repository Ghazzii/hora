import Link from "next/link";
import Form from "next/form";
import { Search, UserRound } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { formatAdminDate, timeAgo } from "@/lib/dates";
import { formatTunisianPhone } from "@/lib/phone";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ContactActions } from "@/components/admin/ContactActions";
import { cn } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; view?: string }> }) {
  const query = await searchParams;
  const q = query.q?.trim().slice(0, 100);
  const view = query.view === "accounts" ? "accounts" : "buyers";
  const tabs = [["buyers", "Buyers"], ["accounts", "Accounts"]] as const;

  return (
    <>
      <AdminPageHeader eyebrow="Relationships" title="Customers" description="Buyers are grouped by phone number, so guests and repeat customers appear together." />
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {tabs.map(([value, label]) => (
            <Link key={value} href={`/admin/customers?${new URLSearchParams({ view: value, ...(q ? { q } : {}) })}`} className={cn("inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition", view === value ? "bg-ink text-white" : "bg-white text-ink/70 hover:text-ink")}>{label}</Link>
          ))}
        </div>
        <Form action="/admin/customers" className="relative ml-auto w-full max-w-sm">
          <input type="hidden" name="view" value={view} />
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <label className="sr-only" htmlFor="customer-search">Search customers</label>
          <input id="customer-search" className="field h-10 pl-10" name="q" type="search" defaultValue={q} placeholder="Name, phone or email" />
        </Form>
      </div>
      {view === "buyers" ? <Buyers q={q} /> : <Accounts q={q} />}
    </>
  );
}

async function Buyers({ q }: { q?: string }) {
  const digits = q?.replace(/\D/g, "") ?? "";
  const where: Prisma.OrderWhereInput = q
    ? { OR: [{ customerFirstName: { contains: q, mode: "insensitive" } }, { customerLastName: { contains: q, mode: "insensitive" } }, { customerEmail: { contains: q, mode: "insensitive" } }, ...(digits.length >= 4 ? [{ phone: { contains: digits.slice(-8) } }] : [])] }
    : {};
  const groups = await db.order.groupBy({
    by: ["phone"],
    where,
    _count: { _all: true },
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: "desc" } },
    take: 150,
  });
  const phones = groups.map((group) => group.phone);
  const [latest, delivered] = await Promise.all([
    db.order.findMany({ where: { phone: { in: phones } }, orderBy: { createdAt: "desc" }, distinct: ["phone"], select: { phone: true, id: true, customerFirstName: true, customerLastName: true, customerEmail: true, city: true, governorate: true, userId: true, status: true } }),
    db.order.groupBy({ by: ["phone"], where: { phone: { in: phones }, status: "DELIVERED" }, _sum: { totalMillimes: true }, _count: { _all: true } }),
  ]);
  const latestBy = new Map(latest.map((order) => [order.phone, order]));
  const deliveredBy = new Map(delivered.map((row) => [row.phone, row]));

  if (!groups.length) return <div className="mt-6 rounded-3xl border border-dashed border-ink/15 bg-white/50 px-6 py-16 text-center text-ink/55">{q ? "No buyers match your search." : "No orders yet."}</div>;

  return (
    <div className="admin-card mt-6 overflow-x-auto p-0">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-ink/[.08] bg-ink/[.02] text-[11px] uppercase tracking-[.12em] text-ink/50">
          <tr><th className="px-5 py-3 font-semibold">Customer</th><th className="px-4 py-3 font-semibold">Location</th><th className="px-4 py-3 text-right font-semibold">Orders</th><th className="px-4 py-3 text-right font-semibold">Delivered spend</th><th className="px-4 py-3 font-semibold">Last order</th><th className="px-5 py-3"><span className="sr-only">Contact</span></th></tr>
        </thead>
        <tbody className="divide-y divide-ink/[.06]">
          {groups.map((group) => {
            const person = latestBy.get(group.phone);
            const spend = deliveredBy.get(group.phone);
            return (
              <tr key={group.phone} className="transition hover:bg-ivory/60">
                <td className="px-5 py-3.5">
                  <Link href={`/admin/orders?q=${encodeURIComponent(group.phone.slice(-8))}`} className="font-semibold hover:text-gold-dark">{person?.customerFirstName} {person?.customerLastName}</Link>
                  <p className="text-xs text-ink/50">{formatTunisianPhone(group.phone)}{person?.userId ? " · account" : ""}</p>
                </td>
                <td className="px-4 py-3.5 text-ink/70">{person?.city}<p className="text-xs text-ink/45">{person?.governorate}</p></td>
                <td className="px-4 py-3.5 text-right tabular-nums">{group._count._all}{group._count._all > 1 && <span className="ml-1.5 rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-dark">repeat</span>}</td>
                <td className="px-4 py-3.5 text-right font-semibold tabular-nums">{formatTnd(spend?._sum.totalMillimes ?? 0, "en")}</td>
                <td className="px-4 py-3.5 text-ink/60">{group._max.createdAt ? <span title={formatAdminDate(group._max.createdAt, true)}>{timeAgo(group._max.createdAt)}</span> : "—"}</td>
                <td className="px-5 py-3.5"><div className="flex justify-end"><ContactActions phone={group.phone} size="sm" /></div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

async function Accounts({ q }: { q?: string }) {
  const customers = await db.user.findMany({
    where: { role: "CUSTOMER", ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { phone: { contains: q.replace(/\D/g, "").slice(-8) || q } }, { firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] } : {}) },
    include: { orders: { select: { totalMillimes: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: 150,
  });
  if (!customers.length) return <div className="mt-6 rounded-3xl border border-dashed border-ink/15 bg-white/50 px-6 py-16 text-center text-ink/55">No registered accounts{q ? " match your search" : " yet"}.</div>;
  return (
    <ul className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {customers.map((customer) => (
        <li key={customer.id}>
          <Link href={`/admin/customers/${customer.id}`} className="admin-card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sand text-gold-dark"><UserRound size={18} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{customer.firstName} {customer.lastName}{!customer.active && <span className="ml-2 text-xs font-normal text-red-700">disabled</span>}</p>
              <p className="truncate text-xs text-ink/50">{customer.email}</p>
            </div>
            <div className="text-right text-xs text-ink/55"><p className="font-semibold text-ink">{customer.orders.length} order{customer.orders.length === 1 ? "" : "s"}</p><p>{formatTnd(customer.orders.filter((order) => order.status === "DELIVERED").reduce((sum, order) => sum + order.totalMillimes, 0), "en")}</p></div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
