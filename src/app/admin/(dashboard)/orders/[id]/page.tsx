import { notFound } from "next/navigation";
import { PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { formatTnd } from "@/lib/money";
import { ORDER_TRANSITIONS } from "@/lib/order-rules";
import { Badge } from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";
import { updateOrderNotesAction, updateOrderStatusAction, updatePaymentStatusAction } from "@/features/admin/actions";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true, statusHistory: { include: { actor: true }, orderBy: { createdAt: "asc" } } } });
  if (!order) notFound();
  const transitions = ORDER_TRANSITIONS[order.status];
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Order</p><h1 className="mt-2 font-display text-4xl">{order.orderNumber}</h1></div><div className="flex gap-2"><Badge>{order.status}</Badge><Badge>{order.paymentStatus}</Badge></div></div>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="admin-card"><h2 className="font-display text-2xl">Items</h2><Table className="mt-4"><thead><tr><Th>Product</Th><Th>SKU</Th><Th>Qty</Th><Th>Unit</Th><Th>Total</Th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id}><Td>{item.productNameFr}<br /><small>{item.variantLabelFr}</small></Td><Td>{item.sku}</Td><Td>{item.quantity}</Td><Td>{formatTnd(item.unitPriceMillimes)}</Td><Td>{formatTnd(item.lineTotalMillimes)}</Td></tr>)}</tbody></Table><dl className="ml-auto mt-5 max-w-xs space-y-2 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatTnd(order.subtotalMillimes)}</dd></div><div className="flex justify-between"><dt>Delivery</dt><dd>{formatTnd(order.deliveryFeeMillimes)}</dd></div><div className="flex justify-between border-t pt-3 text-lg font-bold"><dt>Total COD</dt><dd>{formatTnd(order.totalMillimes)}</dd></div></dl></section>
          <section className="admin-card"><h2 className="font-display text-2xl">Timeline</h2><ol className="mt-5 space-y-5 border-l border-gold pl-5">{order.statusHistory.map((entry) => <li key={entry.id}><p className="font-bold">{entry.toStatus}</p><p className="text-xs text-black/50">{entry.createdAt.toLocaleString("fr-TN")} · {entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : "Customer/system"}</p>{entry.note && <p className="mt-1 text-sm">{entry.note}</p>}</li>)}</ol></section>
        </div>
        <aside className="space-y-6">
          <section className="admin-card"><h2 className="font-display text-2xl">Customer</h2><p className="mt-4 font-bold">{order.customerFirstName} {order.customerLastName}</p><p className="mt-2 text-sm leading-6">{order.phone}<br />{order.customerEmail}<br />{order.addressLine1}{order.addressLine2 ? `, ${order.addressLine2}` : ""}<br />{order.postalCode} {order.city}, {order.governorate}</p>{order.deliveryInstructions && <p className="mt-3 border-l-2 border-gold pl-3 text-sm">{order.deliveryInstructions}</p>}</section>
          <section className="admin-card"><h2 className="font-display text-2xl">Attribution</h2><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><dt className="text-black/50">Source</dt><dd>{order.source ?? "direct"}</dd><dt className="text-black/50">Medium</dt><dd>{order.medium ?? "—"}</dd><dt className="text-black/50">Campaign</dt><dd>{order.campaign ?? order.utmCampaign ?? "—"}</dd><dt className="text-black/50">Campaign ID</dt><dd>{order.campaignId ?? "—"}</dd><dt className="text-black/50">Ad / Ad set</dt><dd>{order.adId ?? "—"} / {order.adSetId ?? "—"}</dd><dt className="text-black/50">Landing</dt><dd className="break-all">{order.landingPage ?? "—"}</dd></dl></section>
          {transitions.length > 0 && <form action={updateOrderStatusAction} className="admin-card"><h2 className="font-display text-2xl">Advance status</h2><input type="hidden" name="orderId" value={order.id} /><select className="field mt-4" name="toStatus" required defaultValue=""><option value="" disabled>Select next status</option>{transitions.map((status) => <option key={status}>{status}</option>)}</select><textarea name="note" className="mt-3 min-h-20 w-full border p-3 text-sm" placeholder="Optional note" /><button className="mt-3 w-full bg-ink px-4 py-3 font-bold text-white">Update status</button></form>}
          <form action={updatePaymentStatusAction} className="admin-card"><h2 className="font-display text-2xl">COD payment</h2><input type="hidden" name="orderId" value={order.id} /><select className="field mt-4" name="paymentStatus" defaultValue={order.paymentStatus}>{Object.values(PaymentStatus).map((status) => <option key={status}>{status}</option>)}</select><button className="mt-3 w-full border border-ink px-4 py-3 font-bold">Save payment status</button></form>
          <form action={updateOrderNotesAction} className="admin-card"><h2 className="font-display text-2xl">Internal notes</h2><input type="hidden" name="orderId" value={order.id} /><textarea name="adminNotes" defaultValue={order.adminNotes ?? ""} className="mt-4 min-h-28 w-full border p-3 text-sm" maxLength={3000} /><button className="mt-3 w-full border border-ink px-4 py-3 font-bold">Save notes</button></form>
        </aside>
      </div>
    </>
  );
}
