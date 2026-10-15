import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentStatus } from "@prisma/client";
import { ArrowLeft, FileSpreadsheet, MapPin, StickyNote } from "lucide-react";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { formatAdminDate, timeAgo } from "@/lib/dates";
import { formatTunisianPhone } from "@/lib/phone";
import { ORDER_TRANSITIONS } from "@/lib/order-rules";
import { NEXT_STEP } from "@/lib/admin-orders";
import { updateOrderNotesAction, updateOrderStatusAction, updatePaymentStatusAction } from "@/features/admin/actions";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { ContactActions } from "@/components/admin/ContactActions";
import { OrderStatusBadge, ORDER_STATUS_STYLE, PaymentBadge } from "@/components/admin/StatusBadge";
import { OrderProgress } from "@/components/site/OrderProgress";
import { CopyButton } from "@/components/ui/CopyButton";
import { cn } from "@/lib/utils";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, sheet] = await Promise.all([
    db.order.findUnique({ where: { id }, include: { items: true, user: { select: { id: true } }, statusHistory: { include: { actor: true }, orderBy: { createdAt: "desc" } } } }),
    db.orderSheetExport.findUnique({ where: { orderId: id }, select: { syncedAt: true, lastError: true } }),
  ]);
  if (!order) notFound();
  const transitions = ORDER_TRANSITIONS[order.status];
  const next = NEXT_STEP[order.status];
  const others = transitions.filter((status) => status !== next?.to);
  const previousOrders = await db.order.count({ where: { phone: order.phone, id: { not: order.id } } });
  const address = [order.addressLine1, order.addressLine2, `${order.postalCode} ${order.city}`.trim(), order.governorate].filter(Boolean).join(", ");
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/55 hover:text-ink"><ArrowLeft size={14} /> All orders</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Order · placed {timeAgo(order.createdAt)}</p>
          <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-4xl font-medium sm:text-5xl">{order.orderNumber}<CopyButton value={order.orderNumber} label="Copy" copiedLabel="Copied" className="font-sans" /></h1>
          <p className="mt-2 text-sm text-ink/50">{formatAdminDate(order.createdAt, true)} · {units} unit{units > 1 ? "s" : ""} · {formatTnd(order.totalMillimes, "en")} cash on delivery</p>
        </div>
        <div className="flex gap-2"><OrderStatusBadge status={order.status} className="px-3 py-1.5 text-xs" /><PaymentBadge status={order.paymentStatus} /></div>
      </div>

      <div className="admin-card mt-6"><OrderProgress status={order.status} locale="en" /></div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {transitions.length > 0 && (
            <ActionForm action={updateOrderStatusAction} className={cn("admin-card border-2", order.status === "PENDING" ? "border-gold/60" : "border-transparent")}>
              <input type="hidden" name="orderId" value={order.id} />
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-medium">{order.status === "PENDING" ? "Call the customer to confirm" : "Move this order forward"}</h2>
                  <p className="mt-1 text-sm text-ink/55">{order.status === "PENDING" ? "Check the items, address and delivery time by phone, then confirm." : `Currently ${ORDER_STATUS_STYLE[order.status].label.toLowerCase()}.`}</p>
                </div>
                {order.status === "PENDING" && <ContactActions phone={order.phone} orderNumber={order.orderNumber} firstName={order.customerFirstName} />}
              </div>
              <label className="mt-5 block"><span className="sr-only">Note for the timeline</span><textarea name="note" className="field min-h-[4.5rem]" rows={2} maxLength={500} placeholder="Optional note for the timeline (e.g. “Customer available after 17h”)" /></label>
              <div className="mt-4 flex flex-wrap gap-2">
                {next && <SubmitButton name="toStatus" value={next.to} className="btn-primary h-11" pendingLabel="Saving…">{next.label}</SubmitButton>}
                {others.map((status) => (
                  <SubmitButton
                    key={status}
                    name="toStatus"
                    value={status}
                    data-confirm={status === "CANCELLED" ? `Cancel ${order.orderNumber}? Stock will be returned to inventory.` : status === "RETURNED" ? `Mark ${order.orderNumber} as returned? Stock will be returned and payment marked refunded.` : undefined}
                    className={cn("btn h-11 px-5 text-sm", status === "CANCELLED" || status === "RETURNED" ? "border border-red-200 text-red-700 hover:bg-red-50" : "btn-outline")}
                  >
                    {status === "CANCELLED" ? "Cancel order" : status === "RETURNED" ? "Mark returned" : ORDER_STATUS_STYLE[status].label}
                  </SubmitButton>
                ))}
              </div>
            </ActionForm>
          )}

          <section className="admin-card">
            <h2 className="font-display text-2xl font-medium">Items</h2>
            <ul className="mt-4 divide-y divide-ink/[.06]">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">{item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />}</div>
                  <div className="min-w-0 flex-1">
                    {item.productId ? <Link href={`/admin/products/${item.productId}`} className="font-medium hover:text-gold-dark">{item.productNameFr}</Link> : <p className="font-medium">{item.productNameFr}</p>}
                    <p className="text-xs text-ink/50">{item.variantLabelFr} · {item.sku}</p>
                  </div>
                  <p className="text-sm text-ink/60 tabular-nums">{item.quantity} × {formatTnd(item.unitPriceMillimes, "en")}</p>
                  <p className="w-28 text-right font-semibold tabular-nums">{formatTnd(item.lineTotalMillimes, "en")}</p>
                </li>
              ))}
            </ul>
            <dl className="ml-auto mt-4 max-w-xs space-y-2 border-t border-ink/[.08] pt-4 text-sm">
              <div className="flex justify-between text-ink/60"><dt>Subtotal</dt><dd className="tabular-nums">{formatTnd(order.subtotalMillimes, "en")}</dd></div>
              <div className="flex justify-between text-ink/60"><dt>Delivery</dt><dd className="tabular-nums">{formatTnd(order.deliveryFeeMillimes, "en")}</dd></div>
              <div className="flex justify-between text-lg font-semibold"><dt>To collect</dt><dd className="tabular-nums">{formatTnd(order.totalMillimes, "en")}</dd></div>
            </dl>
          </section>

          <section className="admin-card">
            <h2 className="font-display text-2xl font-medium">Timeline</h2>
            <ol className="relative mt-5 space-y-5 border-l border-ink/10 pl-6">
              {order.statusHistory.map((entry, index) => (
                <li key={entry.id} className="relative">
                  <span className={cn("absolute -left-[29px] top-1 h-3 w-3 rounded-full ring-4 ring-white", index === 0 ? ORDER_STATUS_STYLE[entry.toStatus].dot : "bg-ink/20")} />
                  <p className="text-sm font-semibold">{entry.fromStatus && entry.fromStatus !== entry.toStatus ? `${ORDER_STATUS_STYLE[entry.fromStatus].label} → ${ORDER_STATUS_STYLE[entry.toStatus].label}` : entry.fromStatus ? "Update" : "Order placed"}</p>
                  <p className="text-xs text-ink/50">{formatAdminDate(entry.createdAt, true)} · {entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : "Customer"}</p>
                  {entry.note && <p className="mt-1.5 rounded-xl bg-ivory px-3 py-2 text-sm text-ink/75">{entry.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="admin-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-medium">{order.customerFirstName} {order.customerLastName}</h2>
                <p className="mt-1 text-xs text-ink/50">{previousOrders ? `${previousOrders} other order${previousOrders > 1 ? "s" : ""} from this number` : "First order from this number"}{order.user ? " · has an account" : " · guest"}</p>
              </div>
            </div>
            <div className="mt-4"><ContactActions phone={order.phone} orderNumber={order.orderNumber} firstName={order.customerFirstName} showNumber /></div>
            {order.customerEmail && <a href={`mailto:${order.customerEmail}`} className="mt-3 block truncate text-sm text-ink/60 hover:text-ink">{order.customerEmail}</a>}
            <div className="mt-5 rounded-2xl bg-ivory p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="flex gap-2 text-sm leading-6"><MapPin size={16} className="mt-1 shrink-0 text-gold-dark" /><span>{order.addressLine1}{order.addressLine2 && <><br />{order.addressLine2}</>}<br />{order.postalCode} {order.city}<br /><strong>{order.governorate}</strong></span></p>
                <CopyButton value={`${order.customerFirstName} ${order.customerLastName}, ${formatTunisianPhone(order.phone)}, ${address}`} label="Copy" copiedLabel="Copied" />
              </div>
              {order.deliveryInstructions && <p className="mt-3 flex gap-2 border-t border-ink/10 pt-3 text-sm text-ink/75"><StickyNote size={15} className="mt-0.5 shrink-0 text-gold-dark" />{order.deliveryInstructions}</p>}
            </div>
            {previousOrders > 0 && <Link href={`/admin/orders?q=${encodeURIComponent(order.phone.slice(-8))}`} className="link-underline mt-4 text-xs">See their other orders</Link>}
          </section>

          <ActionForm action={updatePaymentStatusAction} className="admin-card">
            <h2 className="font-display text-xl font-medium">Cash on delivery</h2>
            <p className="mt-1 text-xs text-ink/50">Set automatically when the order is delivered or returned.</p>
            <input type="hidden" name="orderId" value={order.id} />
            <div className="mt-4 flex gap-2">
              <label className="flex-1"><span className="sr-only">Payment status</span>
                <select className="field h-11" name="paymentStatus" defaultValue={order.paymentStatus}>
                  {Object.values(PaymentStatus).map((status) => <option key={status} value={status}>{status === "UNPAID" ? "Unpaid" : status === "PAID" ? "Paid" : "Refunded"}</option>)}
                </select>
              </label>
              <SubmitButton className="btn-outline h-11 px-4">Save</SubmitButton>
            </div>
          </ActionForm>

          <ActionForm action={updateOrderNotesAction} className="admin-card">
            <h2 className="font-display text-xl font-medium">Internal notes</h2>
            <input type="hidden" name="orderId" value={order.id} />
            <label><span className="sr-only">Internal notes</span><textarea name="adminNotes" defaultValue={order.adminNotes ?? ""} className="field mt-3 min-h-28" maxLength={3000} placeholder="Only visible to the team" /></label>
            <SubmitButton className="btn-outline mt-3 h-10 w-full">Save notes</SubmitButton>
          </ActionForm>

          <section className="admin-card">
            <h2 className="flex items-center gap-2 font-display text-xl font-medium"><FileSpreadsheet size={18} className="text-[#0e6b34]" /> Google Sheets row</h2>
            <p className="mt-2 text-sm text-ink/60">
              {!sheet ? "No row queued for this order." : sheet.syncedAt ? `Up to date · written ${timeAgo(sheet.syncedAt)}` : sheet.lastError ? `Retrying — ${sheet.lastError}` : "Update queued — syncing shortly."}
            </p>
          </section>

          <details className="admin-card group">
            <summary className="cursor-pointer list-none font-display text-xl font-medium marker:hidden">Attribution <span className="float-right text-sm text-ink/40 transition group-open:rotate-180">⌄</span></summary>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-ink/50">Source</dt><dd>{order.source ?? "direct"}</dd>
              <dt className="text-ink/50">Medium</dt><dd>{order.medium ?? "—"}</dd>
              <dt className="text-ink/50">Campaign</dt><dd>{order.campaign ?? order.utmCampaign ?? "—"}</dd>
              <dt className="text-ink/50">Campaign ID</dt><dd>{order.campaignId ?? "—"}</dd>
              <dt className="text-ink/50">Ad / Ad set</dt><dd>{order.adId ?? "—"} / {order.adSetId ?? "—"}</dd>
              <dt className="text-ink/50">Referrer</dt><dd className="break-all">{order.referrer ?? "—"}</dd>
              <dt className="text-ink/50">Landing</dt><dd className="break-all">{order.landingPage ?? "—"}</dd>
            </dl>
          </details>
        </aside>
      </div>
    </>
  );
}
