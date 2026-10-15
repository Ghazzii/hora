"use client";

import { useActionState } from "react";
import { AlertTriangle, ExternalLink, FileSpreadsheet, RefreshCw } from "lucide-react";
import { syncProductsAction } from "@/features/admin/actions";
import type { ActionState } from "@/features/admin/action-state";
import { SubmitButton } from "@/components/admin/ActionForm";
import { useToast } from "@/components/admin/Toaster";

type SyncState = ActionState & { issues?: string[] };

/** "Sync products now" for the Products tab; row problems stay on screen until the next sync. */
export function ProductSheetSync({ spreadsheetUrl, tabName }: { spreadsheetUrl: string | null; tabName: string }) {
  const { notify } = useToast();
  const [state, action] = useActionState(async (_previous: SyncState) => {
    const result = await syncProductsAction();
    if (result.status !== "idle") notify(result.status, result.message);
    return result;
  }, { status: "idle" } as SyncState);
  const issues = state.issues ?? [];

  return (
    <section className="admin-card mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e7f6ec] text-[#0e6b34]"><FileSpreadsheet size={18} /></span>
        <div className="mr-auto">
          <p className="font-medium">Google Sheets catalog</p>
          <p className="text-xs text-ink/50">Prices, names and new watches from the “{tabName}” tab. Stock stays managed here.</p>
        </div>
        <form action={action}>
          <SubmitButton className="btn-primary h-9 px-4 text-xs" pendingLabel="Syncing…"><RefreshCw size={13} /> Sync products now</SubmitButton>
        </form>
        {spreadsheetUrl && (
          <a href={spreadsheetUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost h-9 px-3 text-xs">Open sheet <ExternalLink size={12} /></a>
        )}
      </div>
      {issues.length > 0 && (
        <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="flex items-center gap-2 font-medium"><AlertTriangle size={15} /> {issues.length} row(s) need attention in the sheet</p>
          <ul className="mt-2 grid gap-1 text-xs leading-5">
            {issues.slice(0, 30).map((issue, index) => <li key={index}>{issue}</li>)}
            {issues.length > 30 && <li>…and {issues.length - 30} more.</li>}
          </ul>
        </div>
      )}
    </section>
  );
}
