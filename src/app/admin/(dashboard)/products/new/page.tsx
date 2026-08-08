import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
export default async function NewProductPage() { const categories = await db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }); return <><p className="eyebrow">Catalog</p><h1 className="mt-2 font-display text-4xl">New product</h1><div className="mt-7"><ProductForm categories={categories} /></div></>; }
