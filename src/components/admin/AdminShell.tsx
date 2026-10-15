import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { ToastProvider } from "@/components/admin/Toaster";

export function AdminShell({
  children,
  userName,
  counts,
}: {
  children: ReactNode;
  userName: string;
  counts: { pendingOrders: number; lowStock: number; pendingReviews: number };
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F3F1EC] text-ink lg:grid lg:grid-cols-[256px_1fr]">
        <AdminNav userName={userName} counts={counts} />
        <main className="min-w-0 px-4 pb-16 pt-6 sm:px-7 lg:px-10 lg:pt-10">
          <div className="mx-auto max-w-[1400px] animate-fade-in">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}

/** Consistent page header for admin screens. */
export function AdminPageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-medium leading-tight sm:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-ink/55">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
