import type { OrderStatus, PaymentStatus, ReviewStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export const ORDER_STATUS_STYLE: Record<OrderStatus, { label: string; className: string; dot: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-50 text-amber-900 ring-amber-200", dot: "bg-amber-500" },
  CONFIRMED: { label: "Confirmed", className: "bg-sky-50 text-sky-900 ring-sky-200", dot: "bg-sky-500" },
  PREPARING: { label: "Preparing", className: "bg-violet-50 text-violet-900 ring-violet-200", dot: "bg-violet-500" },
  SHIPPED: { label: "Shipped", className: "bg-indigo-50 text-indigo-900 ring-indigo-200", dot: "bg-indigo-500" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-50 text-emerald-900 ring-emerald-200", dot: "bg-emerald-500" },
  CANCELLED: { label: "Cancelled", className: "bg-stone-100 text-stone-600 ring-stone-200", dot: "bg-stone-400" },
  RETURNED: { label: "Returned", className: "bg-rose-50 text-rose-900 ring-rose-200", dot: "bg-rose-500" },
};

const PAYMENT_STYLE: Record<PaymentStatus, string> = {
  UNPAID: "bg-stone-100 text-stone-700 ring-stone-200",
  PAID: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  REFUNDED: "bg-rose-50 text-rose-900 ring-rose-200",
};

const REVIEW_STYLE: Record<ReviewStatus, string> = {
  PENDING: "bg-amber-50 text-amber-900 ring-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  REJECTED: "bg-stone-100 text-stone-600 ring-stone-200",
};

const base = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset";

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const style = ORDER_STATUS_STYLE[status];
  return <span className={cn(base, style.className, className)}><span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />{style.label}</span>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={cn(base, PAYMENT_STYLE[status])}>{status === "UNPAID" ? "COD unpaid" : status === "PAID" ? "Paid" : "Refunded"}</span>;
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  return <span className={cn(base, REVIEW_STYLE[status])}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}
