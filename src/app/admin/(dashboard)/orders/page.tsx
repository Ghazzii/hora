import Link from "next/link";
import Form from "next/form";
import { OrderStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { formatAdminDate, timeAgo } from "@/lib/dates";
import { formatTunisianPhone } from "@/lib/phone";
import { NEXT_STEP, orderWhere, type OrderFilters } from "@/lib/admin-orders";
import { updateOrderStatusAction } from "@/features/admin/actions";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { ContactActions } from "@/components/admin/ContactActions";
import { ORDER_STATUS_STYLE, OrderStatusBadge } from "@/components/admin/StatusBadge";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };
const PAGE_SIZE = 40;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const filters: OrderFilters = { q: first(raw.q), status: first(raw.status), source: first(raw.source), from: first(raw.from), to: first(raw.to) };
  const page = Math.max(1, Number.parseInt(first(raw.page) ?? "1", 10) || 1);
  const where = orderWhere(filters);
  const [orders, total, counts, sources] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { items: true } } },
    }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], where: orderWhere(filters, { includeStatus: false }), _count: { _all: true } }),
    db.order.findMany({ distinct: ["source"], select: { source: true }, take: 30 }),
  ]);
  const countFor = (status?: OrderStatus) => counts.filter((row) => !status || row.status === status).reduce((sum, row) => sum + row._count._all, 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, page: undefined, ...changes })) if (value) params.set(key, value);
    const query = params.toString();
    return `/admin/orders${query ? `?${query}` : ""}`;
  };
  const exportParams = new URLSearchParams(Object.entries(filters).filter((entry): entry is [string, string] => Boolean(entry[1])));
  const now = new Date();
  const hasFilters = Boolean(filters.q || filters.source || filters.from || filters.to);

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations"
        title="Orders"
        description="Call to confirm new orders, then move each one through preparation, shipping and delivery."
        actions={<a href={`/api/admin/orders/export${exportParams.size ? `?${exportParams}` : ""}`} className="btn-outline h-10 px-4 text-xs"><Download size={14} /> Export CSV</a>}
      />

      <nav className="no-scrollbar -mx-4 mt-7 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Filter by status">
        {[undefined, ...Object.values(OrderStatus)].map((status) => {
          const active = (filters.status ?? undefined) === status;
          return (
            <Link key={status ?? "all"} href={href({ status })} aria-current={active ? "page" : undefined} className={cn("inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition", active ? "bg-ink text-white" : "bg-white text-ink/70 hover:text-ink")}>
              {status && <span className={cn("h-1.5 w-1.5 rounded-full", ORDER_STATUS_STYLE[status].dot)} />}
              {status ? ORDER_STATUS_STYLE[status].label : "All"}
              <span className={cn("text-xs tabular-nums", active ? "text-white/60" : "text-ink/40")}>{countFor(status)}</span>
            </Link>
          );
        })}
      </nav>

      <Form action="/admin/orders" className="mt-4 grid gap-2 rounded-2xl bg-white p-3 shadow-soft sm:grid-cols-[1fr_auto_auto_auto_auto]">
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <label className="relative">
          <span className="sr-only">Search orders</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input className="field h-11 pl-10" name="q" type="search" defaultValue={filters.q} placeholder="Order number, name, phone, city…" />
        </label>
        <label><span className="sr-only">Source</span>
          <select className="field h-11" name="source" defaultValue={filters.source ?? ""}>
            <option value="">All sources</option>
            {sources.map((item) => <option key={item.source ?? "direct"} value={item.source ?? "direct"}>{item.source ?? "direct"}</option>)}
          </select>
        </label>
        <label><span className="sr-only">From date</span><input className="field h-11" type="date" name="from" defaultValue={filters.from} aria-label="From date" /></label>
        <label><span className="sr-only">To date</span><input className="field h-11" type="date" name="to" defaultValue={filters.to} aria-label="To date" /></label>
        <div className="flex gap-2">
          <button className="btn-primary h-11 flex-1 px-5">Filter</button>
          {hasFilters && <Link href={href({ q: undefined, source: undefined, from: undefined, to: undefined })} className="btn-ghost h-11">Clear</Link>}
        </div>
      </Form>

      <p className="mt-5 text-sm text-ink/50">{total} order{total === 1 ? "" : "s"}{pageCount > 1 ? ` · page ${page} of ${pageCount}` : ""}</p>

      {orders.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-ink/15 bg-white/50 px-6 py-16 text-center text-ink/55">No orders match these filters.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="admin-card mt-4 hidden overflow-hidden p-0 lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/[.08] bg-ink/[.02] text-[11px] uppercase tracking-[.12em] text-ink/50">
                <tr><th className="px-5 py-3 font-semibold">Order</th><th className="px-4 py-3 font-semibold">Customer</th><th className="px-4 py-3 font-semibold">Destination</th><th className="px-4 py-3 text-right font-semibold">Total</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Next step</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/[.06]">
                {orders.map((order) => {
                  const next = NEXT_STEP[order.status];
                  return (
                    <tr key={order.id} className="group transition hover:bg-ivory/60">
                      <td className="px-5 py-4"><Link className="font-semibold hover:text-gold-dark" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link><p className="text-xs text-ink/45" title={formatAdminDate(order.createdAt, true)}>{timeAgo(order.createdAt, now)} · {order._count.items} item{order._count.items > 1 ? "s" : ""}</p></td>
                      <td className="px-4 py-4"><p className="font-medium">{order.customerFirstName} {order.customerLastName}</p><a href={`tel:${order.phone}`} className="text-xs text-ink/50 hover:text-ink">{formatTunisianPhone(order.phone)}</a></td>
                      <td className="px-4 py-4"><p>{order.city}</p><p className="text-xs text-ink/45">{order.governorate}{order.source ? ` · ${order.source}` : ""}</p></td>
                      <td className="px-4 py-4 text-right font-semibold tabular-nums">{formatTnd(order.totalMillimes, "en")}</td>
                      <td className="px-4 py-4"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === "PENDING" && <ContactActions phone={order.phone} orderNumber={order.orderNumber} firstName={order.customerFirstName} size="sm" />}
                          {next && (
                            <ActionForm action={updateOrderStatusAction}>
                              <input type="hidden" name="orderId" value={order.id} />
                              <input type="hidden" name="toStatus" value={next.to} />
                              <SubmitButton className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 text-xs font-semibold transition hover:border-ink hover:bg-ink hover:text-white">{next.label}</SubmitButton>
                            </ActionForm>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="mt-4 grid gap-3 lg:hidden">
            {orders.map((order) => {
              const next = NEXT_STEP[order.status];
              return (
                <li key={order.id} className="admin-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/admin/orders/${order.id}`} className="min-w-0">
                      <p className="font-semibold">{order.customerFirstName} {order.customerLastName}</p>
                      <p className="text-xs text-ink/50">{order.orderNumber} · {timeAgo(order.createdAt, now)}</p>
                    </Link>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 text-sm text-ink/60">{order.city}, {order.governorate} · <strong className="text-ink">{formatTnd(order.totalMillimes, "en")}</strong></p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {order.status === "PENDING" && <ContactActions phone={order.phone} orderNumber={order.orderNumber} firstName={order.customerFirstName} size="sm" />}
                    {next && (
                      <ActionForm action={updateOrderStatusAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="toStatus" value={next.to} />
                        <SubmitButton className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ink/15 px-3 text-xs font-semibold">{next.label}</SubmitButton>
                      </ActionForm>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {pageCount > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 ? <Link href={href({ page: String(page - 1) })} className="btn-outline h-10 px-4 text-xs"><ChevronLeft size={14} /> Newer</Link> : null}
          <span className="px-3 text-sm text-ink/50">Page {page} / {pageCount}</span>
          {page < pageCount ? <Link href={href({ page: String(page + 1) })} className="btn-outline h-10 px-4 text-xs">Older <ChevronRight size={14} /></Link> : null}
        </nav>
      )}
    </>
  );
}
