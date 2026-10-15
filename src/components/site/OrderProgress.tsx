import type { OrderStatus } from "@prisma/client";
import { Check } from "lucide-react";
import { statusLabel } from "@/lib/order-rules";
import { cn } from "@/lib/utils";

const FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"];

export function OrderProgress({ status, locale }: { status: OrderStatus; locale: "fr" | "en" }) {
  if (status === "CANCELLED" || status === "RETURNED") {
    return <p className="rounded-2xl bg-ink/[.05] px-5 py-4 text-sm font-semibold text-ink/70">{statusLabel(status, locale)}</p>;
  }
  const current = FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label={locale === "fr" ? "Progression de la commande" : "Order progress"}>
      {FLOW.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex flex-col items-center text-center" aria-current={active ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", index === 0 ? "bg-transparent" : index <= current ? "bg-gold" : "bg-ink/10")} />
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition", done && "bg-gold text-ink", active && "bg-ink text-white ring-4 ring-gold/30", !done && !active && "bg-ink/[.06] text-ink/40")}>
                {done ? <Check size={14} /> : index + 1}
              </span>
              <span className={cn("h-0.5 flex-1", index === FLOW.length - 1 ? "bg-transparent" : index < current ? "bg-gold" : "bg-ink/10")} />
            </div>
            <span className={cn("mt-2 text-[11px] leading-tight", active ? "font-bold text-ink" : "text-ink/50")}>{statusLabel(step, locale)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderStatusPill({ status, locale }: { status: OrderStatus; locale: "fr" | "en" }) {
  const tone: Record<OrderStatus, string> = {
    PENDING: "bg-amber-100 text-amber-900",
    CONFIRMED: "bg-sky-100 text-sky-900",
    PREPARING: "bg-violet-100 text-violet-900",
    SHIPPED: "bg-indigo-100 text-indigo-900",
    DELIVERED: "bg-emerald-100 text-emerald-900",
    CANCELLED: "bg-ink/[.07] text-ink/60",
    RETURNED: "bg-rose-100 text-rose-900",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold", tone[status])}>{statusLabel(status, locale)}</span>;
}
