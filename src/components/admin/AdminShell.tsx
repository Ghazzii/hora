import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  Boxes,
  Gauge,
  MessageSquareText,
  PackageSearch,
  ShoppingBag,
  Users,
} from "lucide-react";

export function AdminShell({
  children,
  userName,
}: {
  children: ReactNode;
  userName: string;
}) {
  const links = [
    ["/admin", "Dashboard", Gauge],
    ["/admin/orders", "Orders", ShoppingBag],
    ["/admin/products", "Products", PackageSearch],
    ["/admin/inventory", "Inventory", Boxes],
    ["/admin/customers", "Customers", Users],
    ["/admin/reviews", "Reviews", MessageSquareText],
    ["/admin/analytics", "Analytics", BarChart3],
  ] as const;
  return (
    <div className="min-h-screen bg-[#F1EFEA] text-ink lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="bg-ink p-5 text-white lg:min-h-screen">
        <Link href="/admin" className="font-display text-3xl tracking-[.18em] text-gold">HORA</Link>
        <p className="mt-2 text-xs text-white/50">Administration · {userName}</p>
        <nav className="mt-7 flex gap-2 overflow-x-auto lg:block lg:space-y-1" aria-label="Admin navigation">
          {links.map(([href, label, Icon]) => (
            <Link key={href} href={href} className="flex shrink-0 items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-white/75 hover:bg-white/10 hover:text-white">
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <Link href="/fr" className="mt-8 block text-xs text-white/50 hover:text-white">← View storefront</Link>
      </aside>
      <main className="min-w-0 p-4 sm:p-7 lg:p-10">{children}</main>
    </div>
  );
}
