import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const [product, categories] = await Promise.all([db.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { createdAt: "asc" } } } }), db.category.findMany({ orderBy: { sortOrder: "asc" } })]); if (!product) notFound(); return <><p className="eyebrow">Catalog</p><h1 className="mt-2 font-display text-4xl">{product.nameFr}</h1><div className="mt-7"><ProductForm product={product} categories={categories} /></div></>; }
