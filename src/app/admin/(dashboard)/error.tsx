"use client";

import { RotateCcw } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="admin-card mx-auto mt-10 max-w-lg text-center">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-3 font-display text-3xl font-medium">This page couldn&apos;t load.</h1>
      <p className="mt-3 text-sm text-ink/60">The database may be waking up or briefly unreachable. Try again in a moment.</p>
      {error.digest && <p className="mt-2 font-mono text-[11px] text-ink/40">Reference {error.digest}</p>}
      <button type="button" onClick={reset} className="btn-primary mt-6"><RotateCcw size={15} /> Try again</button>
    </div>
  );
}
