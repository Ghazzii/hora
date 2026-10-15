import { ExternalLink, FileSpreadsheet, RefreshCw } from "lucide-react";
import { orderSheetHealth } from "@/lib/google-sheets";
import { rebuildSheetsAction, syncSheetsAction } from "@/features/admin/actions";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { formatAdminDate, timeAgo } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Health and manual controls for the Google Sheets order log. */
export async function SheetsCard() {
  const health = await orderSheetHealth().catch(() => null);
  const state = !health ? "unknown" : !health.configured ? "off" : health.failing ? "failing" : health.pending ? "pending" : "ok";
  const tone = {
    ok: { dot: "bg-emerald-500", text: "All orders are in the sheet" },
    pending: { dot: "bg-amber-500", text: `${health?.pending ?? 0} row(s) waiting to sync` },
    failing: { dot: "bg-red-500", text: `${health?.failing ?? 0} row(s) failing — retrying automatically` },
    off: { dot: "bg-stone-400", text: "Not configured on this deployment" },
    unknown: { dot: "bg-stone-400", text: "Status unavailable" },
  }[state];
  return (
    <section className="admin-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-gold-dark">Order log</p>
          <h2 className="mt-1 font-display text-2xl font-medium">Google Sheets</h2>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e7f6ec] text-[#0e6b34]"><FileSpreadsheet size={18} /></span>
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm font-medium">
        <span className={cn("h-2 w-2 rounded-full", tone.dot, state === "pending" && "animate-pulse")} /> {tone.text}
      </p>
      {health?.lastSyncedAt && (
        <p className="mt-1 text-xs text-ink/50" title={formatAdminDate(health.lastSyncedAt, true)}>Last write {timeAgo(health.lastSyncedAt)}</p>
      )}
      {health?.configured && (
        <div className="mt-5 flex flex-wrap gap-2">
          <ActionForm action={syncSheetsAction}>
            <SubmitButton className="btn-primary h-9 px-4 text-xs"><RefreshCw size={13} /> Sync now</SubmitButton>
          </ActionForm>
          <ActionForm action={rebuildSheetsAction} confirm="Rewrite every order row with its current status and payment? Existing rows keep their position.">
            <SubmitButton className="btn-outline h-9 px-4 text-xs">Refresh all rows</SubmitButton>
          </ActionForm>
          {health.spreadsheetUrl && (
            <a href={health.spreadsheetUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost h-9 px-3 text-xs">Open sheet <ExternalLink size={12} /></a>
          )}
        </div>
      )}
      <p className="mt-4 text-xs leading-5 text-ink/45">Each order keeps one stable row. Status and payment changes update that row automatically.</p>
    </section>
  );
}
