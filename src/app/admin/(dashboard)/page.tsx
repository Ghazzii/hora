import Link from "next/link";
import { ArrowUpRight, Banknote, CheckCircle2, PackageOpen, PhoneCall, ShoppingBag, Truck } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { daysAgo, timeAgo, tunisDay } from "@/lib/dates";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ColumnChart, StatTile, percentChange } from "@/components/admin/charts";
import { ContactActions } from "@/components/admin/ContactActions";
import { SheetsCard } from "@/components/admin/SheetsCard";
import { ORDER_STATUS_STYLE } from "@/components/admin/StatusBadge";
import { cn } from "@/lib/utils";

const ACTIVE: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED"];

function greeting(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Tunis", hour: "numeric", hour12: false }).format(now));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export default async function AdminDashboard() {
  const now = new Date();
  const [recent, pipeline, toCall, lowStock] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: daysAgo(30, now) } },
      select: { id: true, status: true, totalMillimes: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.order.groupBy({ by: ["status"], where: { status: { in: ACTIVE } }, _count: { _all: true }, _sum: { totalMillimes: true } }),
    db.order.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 6,
      select: { id: true, orderNumber: true, customerFirstName: true, customerLastName: true, phone: true, city: true, governorate: true, totalMillimes: true, createdAt: true, _count: { select: { items: true } } },
    }),
    db.$queryRaw<{ id: string; sku: string; stock: number; lowStockThreshold: number; productId: string; nameFr: string }[]>`
      SELECT v."id", v."sku", v."stock", v."lowStockThreshold", p."id" AS "productId", p."nameFr"
      FROM "ProductVariant" v JOIN "Product" p ON p."id" = v."productId"
      WHERE v."active" = true AND p."active" = true AND v."stock" <= v."lowStockThreshold"
      ORDER BY v."stock" ASC LIMIT 6`,
  ]);

  const live = recent.filter((order) => order.status !== "CANCELLED");
  const inRange = (from: number, to: number) => live.filter((order) => order.createdAt >= daysAgo(from, now) && order.createdAt < daysAgo(to, now));
  const thisWeek = inRange(7, 0);
  const lastWeek = inRange(14, 7);
  const sum = (orders: { totalMillimes: number }[]) => orders.reduce((total, order) => total + order.totalMillimes, 0);
  const delivered30 = recent.filter((order) => order.status === "DELIVERED");
  const resolved30 = recent.filter((order) => ["DELIVERED", "CANCELLED", "RETURNED"].includes(order.status));
  const deliveryRate = resolved30.length ? Math.round((delivered30.length / resolved30.length) * 100) : null;
  const pipelineValue = pipeline.reduce((total, row) => total + (row._sum.totalMillimes ?? 0), 0);

  const days = Array.from({ length: 14 }, (_, index) => {
    const date = daysAgo(13 - index, now);
    return { key: tunisDay(date), date };
  });
  const perDay = new Map(days.map((day) => [day.key, { count: 0, value: 0 }]));
  for (const order of live) {
    const bucket = perDay.get(tunisDay(order.createdAt));
    if (bucket) { bucket.count += 1; bucket.value += order.totalMillimes; }
  }
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", timeZone: "Africa/Tunis" });
  const chart = days.map((day, index) => {
    const bucket = perDay.get(day.key)!;
    const label = weekday.format(day.date);
    return {
      key: day.key,
      label,
      value: bucket.count,
      axisLabel: index % 2 === 1 || index === days.length - 1 ? label.split(" ")[1] : "",
      tooltip: `${label}: ${bucket.count} order${bucket.count === 1 ? "" : "s"} · ${formatTnd(bucket.value, "en")}`,
    };
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Sales command center"
        title={`${greeting(now)}.`}
        description="What needs your attention today, and how the store is doing."
        actions={<Link href="/admin/orders?status=PENDING" className="btn-primary h-11"><PhoneCall size={16} /> Confirm orders</Link>}
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Orders · 7 days" value={String(thisWeek.length)} delta={percentChange(thisWeek.length, lastWeek.length)} deltaLabel="vs previous 7 days" icon={<ShoppingBag size={15} />} />
        <StatTile label="Order value · 7 days" value={formatTnd(sum(thisWeek), "en")} delta={percentChange(sum(thisWeek), sum(lastWeek))} deltaLabel="vs previous 7 days" icon={<Banknote size={15} />} />
        <StatTile label="In progress" value={formatTnd(pipelineValue, "en")} icon={<Truck size={15} />} />
        <StatTile label="Delivery rate · 30 days" value={deliveryRate === null ? "—" : `${deliveryRate}%`} icon={<CheckCircle2 size={15} />} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="admin-card">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-gold-dark">Rhythm</p>
              <h2 className="mt-1 font-display text-2xl font-medium">Orders per day, last 14 days</h2>
            </div>
            <span className="text-xs text-ink/45">Excludes cancelled · Tunis time</span>
          </div>
          <div className="mt-8"><ColumnChart data={chart} title="Orders per day, last 14 days" formatValue={(value) => String(value)} integer /></div>
        </section>

        <section className="admin-card">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-gold-dark">Pipeline</p>
          <h2 className="mt-1 font-display text-2xl font-medium">Orders in progress</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3">
            {ACTIVE.map((status) => {
              const row = pipeline.find((item) => item.status === status);
              const style = ORDER_STATUS_STYLE[status];
              return (
                <li key={status}>
                  <Link href={`/admin/orders?status=${status}`} className="group block rounded-2xl border border-ink/[.08] p-4 transition hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-soft">
                    <span className="flex items-center gap-2 text-xs font-semibold text-ink/60"><span className={cn("h-2 w-2 rounded-full", style.dot)} />{style.label}</span>
                    <span className="mt-2 block text-2xl font-semibold">{row?._count._all ?? 0}</span>
                    <span className="text-xs text-ink/45">{formatTnd(row?._sum.totalMillimes ?? 0, "en")}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="admin-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-gold-dark">To confirm</p>
              <h2 className="mt-1 font-display text-2xl font-medium">Customers waiting for a call</h2>
            </div>
            <Link href="/admin/orders?status=PENDING" className="link-underline text-sm">All pending <ArrowUpRight size={14} /></Link>
          </div>
          {toCall.length ? (
            <ul className="mt-5 divide-y divide-ink/[.08]">
              {toCall.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold hover:text-gold-dark">{order.customerFirstName} {order.customerLastName}</Link>
                    <p className="text-xs text-ink/50">{order.orderNumber} · {order.city}, {order.governorate} · {order._count.items} item{order._count.items > 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatTnd(order.totalMillimes, "en")}</p>
                    <p className={cn("text-xs", now.getTime() - order.createdAt.getTime() > 86_400_000 ? "font-semibold text-red-700" : "text-ink/45")}>{timeAgo(order.createdAt, now)}</p>
                  </div>
                  <ContactActions phone={order.phone} orderNumber={order.orderNumber} firstName={order.customerFirstName} size="sm" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-900"><CheckCircle2 size={18} /> Nothing waiting — every order has been confirmed.</div>
          )}
        </section>

        <div className="space-y-6">
          <SheetsCard />
          <section className="admin-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-gold-dark">Inventory</p>
                <h2 className="mt-1 font-display text-2xl font-medium">Low stock</h2>
              </div>
              <PackageOpen size={20} className="text-gold-dark" />
            </div>
            <ul className="mt-4 divide-y divide-ink/[.08]">
              {lowStock.length ? lowStock.map((variant) => (
                <li key={variant.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <Link href={`/admin/products/${variant.productId}`} className="min-w-0 hover:text-gold-dark"><span className="block truncate font-medium">{variant.nameFr}</span><small className="text-ink/45">{variant.sku}</small></Link>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", variant.stock === 0 ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900")}>{variant.stock === 0 ? "Sold out" : `${variant.stock} left`}</span>
                </li>
              )) : <li className="py-4 text-sm text-ink/50">Every active option is above its low-stock threshold.</li>}
            </ul>
            <Link href="/admin/inventory" className="link-underline mt-4 text-sm">Open inventory <ArrowUpRight size={14} /></Link>
          </section>
        </div>
      </div>
    </>
  );
}
