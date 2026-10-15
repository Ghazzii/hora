"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = { id: number; tone: "success" | "error"; message: string };
type ToastContextValue = { notify: (tone: Toast["tone"], message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const notify = useCallback(
    (tone: Toast["tone"], message: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current.slice(-3), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 7000 : 3500);
    },
    [dismiss],
  );
  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite" role="status">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex animate-slide-down items-start gap-3 rounded-2xl px-4 py-3 text-sm shadow-luxury",
              toast.tone === "success" ? "bg-ink text-white" : "bg-red-700 text-white",
            )}
          >
            {toast.tone === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-gold" /> : <XCircle size={18} className="mt-0.5 shrink-0" />}
            <p className="flex-1 leading-6">{toast.message}</p>
            <button type="button" onClick={() => dismiss(toast.id)} className="grid h-6 w-6 shrink-0 place-items-center rounded-full opacity-60 hover:bg-white/10 hover:opacity-100" aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
