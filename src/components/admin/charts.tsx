import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rounds a maximum up to a clean axis value (1, 2, 2.5, 5 × 10ⁿ). */
function niceMax(value: number) {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * power >= value) ?? 10;
  return step * power;
}

export type BarDatum = { key: string; label: string; value: number; tooltip: string; axisLabel?: string };

/**
 * Single-series column chart. One hue, ≤24px columns with 4px rounded caps,
 * hairline grid, focusable per-column tooltips and a screen-reader table twin.
 */
export function ColumnChart({ data, title, formatValue, height = 180, integer = false }: { data: BarDatum[]; title: string; formatValue: (value: number) => string; height?: number; integer?: boolean }) {
  const max = Math.max(niceMax(Math.max(...data.map((item) => item.value), 0)), integer ? 2 : 0);
  // Counts get whole-number ticks only; positions are computed from each tick's value.
  const ticks = [max, max / 2, 0].filter((tick) => !integer || Number.isInteger(tick));
  const peak = data.reduce((best, item) => (item.value > (best?.value ?? -1) ? item : best), data[0]);
  return (
    <figure>
      <div className="flex gap-3">
        <div className="relative w-10 shrink-0 text-right text-[10px] tabular-nums text-ink/45" style={{ height }} aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - tick / max) * 100}%` }}>{formatValue(tick)}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="relative" style={{ height }}>
            {ticks.map((tick) => (
              <span key={tick} aria-hidden="true" className="absolute inset-x-0 h-px bg-ink/[.08]" style={{ top: `${(1 - tick / max) * 100}%` }} />
            ))}
            <div className="absolute inset-0 flex items-end" role="list" aria-label={title}>
              {data.map((item) => {
                const ratio = item.value / max;
                return (
                  <div key={item.key} role="listitem" className="group relative flex h-full flex-1 items-end justify-center outline-none" tabIndex={0} aria-label={item.tooltip}>
                    {item === peak && item.value > 0 && (
                      <span className="absolute left-1/2 -translate-x-1/2 pb-1 text-[10px] font-semibold text-ink/70" style={{ bottom: `${ratio * 100}%` }} aria-hidden="true">{formatValue(item.value)}</span>
                    )}
                    <span
                      className="w-full max-w-6 rounded-t-[4px] bg-gold-mark transition-[height,opacity] duration-700 ease-out group-hover:opacity-80 group-focus-visible:opacity-80"
                      style={{ height: item.value > 0 ? `max(${ratio * 100}%, 3px)` : "0px", marginInline: "1px" }}
                    />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lift group-hover:block group-focus-visible:block" style={{ bottom: `${ratio * 100}%` }}>
                      {item.tooltip}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex" aria-hidden="true">
            {data.map((item) => <span key={item.key} className="flex-1 truncate text-center text-[10px] text-ink/45">{item.axisLabel ?? ""}</span>)}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>{data.map((item) => <tr key={item.key}><th scope="row">{item.label}</th><td>{formatValue(item.value)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Ranked horizontal bars with the value at the tip — one hue, labels in text tokens. */
export function BarList({ items, formatValue, empty = "No data yet." }: { items: { label: ReactNode; value: number; detail?: string; key: string }[]; formatValue: (value: number) => string; empty?: string }) {
  if (!items.length) return <p className="py-6 text-sm text-ink/50">{empty}</p>;
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="shrink-0 tabular-nums text-ink/70">{formatValue(item.value)}{item.detail && <span className="ml-1.5 text-xs text-ink/40">{item.detail}</span>}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[.06]">
            <div className="h-full rounded-full bg-gold-mark" style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** KPI tile: label · value (sans, proportional figures) · signed delta vs a named period. */
export function StatTile({ label, value, delta, deltaLabel, upIsGood = true, icon }: { label: string; value: string; delta?: number | null; deltaLabel?: string; upIsGood?: boolean; icon?: ReactNode }) {
  const direction = delta === null || delta === undefined || delta === 0 ? 0 : delta > 0 ? 1 : -1;
  const good = direction === 0 ? null : (direction > 0) === upIsGood;
  return (
    <article className="admin-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink/55">{label}</p>
        {icon && <span className="grid h-8 w-8 place-items-center rounded-full bg-ivory text-gold-dark">{icon}</span>}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {delta !== undefined && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/50">
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold", good === null ? "bg-ink/[.05] text-ink/60" : good ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800")}>
            {direction > 0 ? <ArrowUpRight size={12} /> : direction < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
            {delta === null ? "new" : `${delta > 0 ? "+" : ""}${Math.round(delta)}%`}
          </span>
          {deltaLabel}
        </p>
      )}
    </article>
  );
}

/** Percentage change, or null when there is no baseline to compare against. */
export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
