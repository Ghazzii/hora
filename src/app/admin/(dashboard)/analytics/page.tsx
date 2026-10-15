import Link from "next/link";
import { AnalyticsEventType } from "@prisma/client";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { daysAgo, tunisDay } from "@/lib/dates";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { BarList, ColumnChart, StatTile, percentChange } from "@/components/admin/charts";
import { cn } from "@/lib/utils";

export const metadata = { title: "Analytics" };
const PERIODS = [7, 30, 90] as const;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const query = await searchParams;
  const days = PERIODS.find((value) => String(value) === query.days) ?? 30;
  const now = new Date();
  const start = daysAgo(days, now);
  const previousStart = daysAgo(days * 2, now);

  const [orders, previous, events] = await Promise.all([
    db.order.findMany({ where: { createdAt: { gte: start } }, include: { items: { select: { productNameFr: true, productId: true, quantity: true, lineTotalMillimes: true } } } }),
    db.order.findMany({ where: { createdAt: { gte: previousStart, lt: start } }, select: { status: true, totalMillimes: true } }),
    db.analyticsEvent.groupBy({ by: ["eventType"], where: { createdAt: { gte: start } }, _count: { _all: true } }),
  ]);

  const live = orders.filter((order) => order.status !== "CANCELLED");
  const delivered = orders.filter((order) => order.status === "DELIVERED");
  const revenue = delivered.reduce((sum, order) => sum + order.totalMillimes, 0);
  const previousRevenue = previous.filter((order) => order.status === "DELIVERED").reduce((sum, order) => sum + order.totalMillimes, 0);
  const cancelled = orders.filter((order) => order.status === "CANCELLED").length;
  const aov = delivered.length ? Math.round(revenue / delivered.length) : 0;

  // Daily buckets up to a month; weekly beyond that keeps columns readable.
  const bucketDays = days > 31 ? 7 : 1;
  const bucketCount = Math.ceil(days / bucketDays);
  const label = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Tunis" });
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const from = daysAgo((bucketCount - index) * bucketDays, now);
    return { from, to: daysAgo((bucketCount - index - 1) * bucketDays, now), count: 0, value: 0 };
  });
  for (const order of live) {
    const bucket = buckets.find((item) => order.createdAt >= item.from && order.createdAt < item.to);
    if (bucket) { bucket.count += 1; bucket.value += order.totalMillimes; }
  }
  const step = Math.ceil(bucketCount / 8);
  const chart = buckets.map((bucket, index) => {
    const name = bucketDays === 1 ? label.format(bucket.to) : `Week of ${label.format(bucket.from)}`;
    return { key: tunisDay(bucket.from) + index, label: name, value: bucket.count, axisLabel: (bucketCount - 1 - index) % step === 0 ? label.format(bucketDays === 1 ? bucket.to : bucket.from) : "", tooltip: `${name}: ${bucket.count} order${bucket.count === 1 ? "" : "s"} · ${formatTnd(bucket.value, "en")}` };
  });

  const eventCount = (type: AnalyticsEventType) => events.find((row) => row.eventType === type)?._count._all ?? 0;
  const funnel = [
    { key: "view", label: "Viewed a watch", value: eventCount("VIEW_CONTENT") },
    { key: "cart", label: "Added to cart", value: eventCount("ADD_TO_CART") },
    { key: "checkout", label: "Started checkout", value: eventCount("INITIATE_CHECKOUT") },
    { key: "order", label: "Placed an order", value: orders.length },
  ];

  const group = <T,>(entries: [string, T][], merge: (a: T, b: T) => T) => {
    const map = new Map<string, T>();
    for (const [key, value] of entries) map.set(key, map.has(key) ? merge(map.get(key)!, value) : value);
    return map;
  };
  const products = group(orders.filter((order) => order.status !== "CANCELLED").flatMap((order) => order.items.map((item) => [item.productNameFr, { units: item.quantity, value: item.lineTotalMillimes }] as [string, { units: number; value: number }])), (a, b) => ({ units: a.units + b.units, value: a.value + b.value }));
  const governorates = group(live.map((order) => [order.governorate, 1] as [string, number]), (a, b) => a + b);
  const sources = group(orders.map((order) => [order.source ?? "direct", { orders: 1, delivered: order.status === "DELIVERED" ? order.totalMillimes : 0 }] as [string, { orders: number; delivered: number }]), (a, b) => ({ orders: a.orders + b.orders, delivered: a.delivered + b.delivered }));
  const sourceRows = [...sources.entries()].sort((a, b) => b[1].orders - a[1].orders);
  const maxSource = Math.max(...sourceRows.map(([, data]) => data.orders), 1);

  return (
    <>
      <AdminPageHeader
        eyebrow="Store analytics"
        title="Commerce performance"
        description="Figures come from Hora's own orders and first-party events, not third-party trackers."
        actions={
          <div className="flex gap-1 rounded-full bg-white p-1 shadow-soft" role="group" aria-label="Period">
            {PERIODS.map((value) => <Link key={value} href={`/admin/analytics?days=${value}`} aria-current={value === days ? "page" : undefined} className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition", value === days ? "bg-ink text-white" : "text-ink/60 hover:text-ink")}>{value} days</Link>)}
          </div>
        }
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Orders placed" value={String(orders.length)} delta={percentChange(orders.length, previous.length)} deltaLabel={`vs previous ${days} days`} />
        <StatTile label="Delivered revenue" value={formatTnd(revenue, "en")} delta={percentChange(revenue, previousRevenue)} deltaLabel={`vs previous ${days} days`} />
        <StatTile label="Average delivered order" value={formatTnd(aov, "en")} />
        <StatTile label="Cancellation rate" value={orders.length ? `${Math.round((cancelled / orders.length) * 100)}%` : "—"} />
      </section>

      <section className="admin-card mt-6">
        <h2 className="font-display text-2xl font-medium">Orders {bucketDays === 1 ? "per day" : "per week"}</h2>
        <p className="mt-1 text-xs text-ink/45">Excludes cancelled orders · hover or focus a column for value</p>
        <div className="mt-8"><ColumnChart data={chart} title={`Orders ${bucketDays === 1 ? "per day" : "per week"}, last ${days} days`} formatValue={(value) => String(value)} integer /></div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="admin-card">
          <h2 className="font-display text-2xl font-medium">Shopping funnel</h2>
          <p className="mt-1 text-xs text-ink/45">Each step shows its share of product views.</p>
          <div className="mt-6">
            <BarList items={funnel.map((step) => ({ key: step.key, label: step.label, value: step.value, detail: funnel[0]!.value ? `${Math.round((step.value / funnel[0]!.value) * 100)}%` : undefined }))} formatValue={(value) => value.toLocaleString("en")} empty="No visits recorded in this period." />
          </div>
        </section>
        <section className="admin-card">
          <h2 className="font-display text-2xl font-medium">Orders by governorate</h2>
          <div className="mt-6"><BarList items={[...governorates.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ key: name, label: name, value: count }))} formatValue={(value) => String(value)} /></div>
        </section>
        <section className="admin-card">
          <h2 className="font-display text-2xl font-medium">Top watches</h2>
          <div className="mt-6"><BarList items={[...products.entries()].sort((a, b) => b[1].units - a[1].units).slice(0, 8).map(([name, data]) => ({ key: name, label: name, value: data.units, detail: formatTnd(data.value, "en") }))} formatValue={(value) => `${value} sold`} /></div>
        </section>
        <section className="admin-card">
          <h2 className="font-display text-2xl font-medium">Traffic sources</h2>
          {sourceRows.length ? (
            <table className="mt-5 w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-[.12em] text-ink/45"><tr><th className="pb-2 font-semibold">Source</th><th className="pb-2 font-semibold">Orders</th><th className="pb-2 text-right font-semibold">Delivered</th></tr></thead>
              <tbody className="divide-y divide-ink/[.06]">
                {sourceRows.map(([source, data]) => (
                  <tr key={source}>
                    <td className="py-2.5 pr-3">{source}</td>
                    <td className="w-1/2 py-2.5 pr-3"><span className="flex items-center gap-2"><span className="h-1.5 rounded-full bg-gold-mark" style={{ width: `${Math.max(4, (data.orders / maxSource) * 100)}%` }} /><span className="tabular-nums text-ink/70">{data.orders}</span></span></td>
                    <td className="py-2.5 text-right tabular-nums">{formatTnd(data.delivered, "en")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="py-6 text-sm text-ink/50">No orders in this period.</p>}
        </section>
      </div>
    </>
  );
}
