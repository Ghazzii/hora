"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ExternalLink,
  Gauge,
  Menu,
  MessageSquareText,
  PackageSearch,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { LogoutButton } from "@/components/auth/AuthForm";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/site/BrandLogo";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "pendingOrders" },
  { href: "/admin/products", label: "Products", icon: PackageSearch },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, badge: "lowStock" },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText, badge: "pendingReviews" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
] as const;

type Counts = { pendingOrders: number; lowStock: number; pendingReviews: number };

function NavLinks({ counts, onNavigate }: { counts: Counts; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin navigation" className="space-y-1">
      {LINKS.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        const badge = "badge" in link ? link.badge : null;
        const count = badge ? counts[badge] : 0;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
              active ? "bg-white/10 font-semibold text-white" : "text-white/60 hover:bg-white/[.06] hover:text-white",
            )}
          >
            {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold" />}
            <Icon size={18} className={active ? "text-gold" : "transition group-hover:text-white"} />
            <span className="flex-1">{link.label}</span>
            {count > 0 && <span className={cn("min-w-6 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold", badge === "pendingOrders" ? "bg-gold text-ink" : "bg-white/15 text-white")}>{count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ userName }: { userName: string }) {
  return (
    <div className="space-y-3 border-t border-white/10 pt-5">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gold text-sm font-bold text-ink">{userName.charAt(0).toUpperCase()}</span>
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{userName}</p><p className="text-[11px] text-white/45">Administrator</p></div>
      </div>
      <div className="flex gap-2">
        <Link href="/fr" target="_blank" className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 text-xs font-semibold text-white/75 transition hover:border-white/40 hover:text-white">
          Storefront <ExternalLink size={12} />
        </Link>
        <LogoutButton label="Sign out" redirectTo="/admin/login" className="h-9 flex-1 border-white/15 bg-transparent px-3 text-xs text-white/75 hover:border-white/40 hover:bg-transparent hover:text-white" />
      </div>
    </div>
  );
}

export function AdminNav({ userName, counts }: { userName: string; counts: Counts }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  const current = LINKS.find((link) => (link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href)));

  return (
    <>
      <aside className="sticky top-0 hidden h-screen flex-col bg-ink p-5 lg:flex">
        <Link href="/admin" className="px-3" aria-label="Hora — admin"><BrandLogo tone="gold" /></Link>
        <p className="mt-1 px-3 text-[10px] font-bold uppercase tracking-[.24em] text-white/35">Admin</p>
        <div className="mt-8 flex-1 overflow-y-auto"><NavLinks counts={counts} /></div>
        <SidebarFooter userName={userName} />
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-ink px-4 text-white lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label="Open admin menu"><Menu size={20} /></button>
        <span className="text-sm font-semibold">{current?.label ?? "Admin"}</span>
        <Link href="/admin/orders?status=PENDING" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label={`${counts.pendingOrders} pending orders`}>
          <ShoppingBag size={19} />
          {counts.pendingOrders > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-ink">{counts.pendingOrders}</span>}
        </Link>
      </header>

      <Sheet open={open} onClose={close} side="left" label="Admin menu" className="bg-ink text-white">
        <div className="flex h-full flex-col p-5">
          <Link href="/admin" onClick={close} className="self-start px-3" aria-label="Hora — admin"><BrandLogo tone="gold" /></Link>
          <div className="mt-8 flex-1 overflow-y-auto"><NavLinks counts={counts} onNavigate={close} /></div>
          <SidebarFooter userName={userName} />
        </div>
      </Sheet>
    </>
  );
}
