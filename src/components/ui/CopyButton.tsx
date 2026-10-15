"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyButton({ value, label, copiedLabel, className }: { value: string; label: string; copiedLabel: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:bg-ink/[.06]", className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch { /* Clipboard access can be blocked; the value stays visible. */ }
      }}
    >
      {copied ? <Check size={13} className="animate-scale-in text-emerald-700" /> : <Copy size={13} />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
