import type { ReactNode } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Hora Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const [pendingOrders, lowStock, pendingReviews] = await Promise.all([
    db.order.count({ where: { status: "PENDING" } }),
    db.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "ProductVariant" WHERE "active" = true AND "stock" <= "lowStockThreshold"`.then((rows) => Number(rows[0]?.count ?? 0)),
    db.review.count({ where: { status: "PENDING" } }),
  ]).catch(() => [0, 0, 0] as const);
  return <AdminShell userName={admin.firstName} counts={{ pendingOrders, lowStock, pendingReviews }}>{children}</AdminShell>;
}
