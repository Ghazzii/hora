import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { storageConfigured } from "@/lib/storage";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return (
    <>
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/55 hover:text-ink"><ArrowLeft size={14} /> All products</Link>
      <div className="mt-4"><AdminPageHeader eyebrow="Catalog" title="New product" description="Only the name, category and price are required. Everything else can be refined later." /></div>
      <div className="mt-7"><ProductForm categories={categories} uploadEnabled={storageConfigured()} /></div>
    </>
  );
}
