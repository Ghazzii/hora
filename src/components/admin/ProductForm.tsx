import type { Category, Product, ProductImage, ProductVariant } from "@prisma/client";
import { saveProductAction } from "@/features/admin/actions";

type FullProduct = Product & { images: ProductImage[]; variants: ProductVariant[] };

export function ProductForm({ product, categories }: { product?: FullProduct | null; categories: Category[] }) {
  const variant = product?.variants[0];
  const image = product?.images[0]?.url ?? "/images/watch-1.svg";
  return (
    <form action={saveProductAction} className="admin-card max-w-3xl space-y-6">
      {product && <input type="hidden" name="productId" value={product.id} />}
      {variant && <input type="hidden" name="variantId" value={variant.id} />}
      <div><p className="text-sm text-black/55">Add the essentials now. Product details can be refined later.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="label">Product name</span><input className="field mt-2" name="nameFr" required placeholder="e.g. Atlas Heritage" defaultValue={product?.nameFr} /></label>
        <label><span className="label">Category</span><select className="field mt-2" name="categoryId" required defaultValue={product?.categoryId ?? ""}><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nameFr}</option>)}</select></label>
        <label><span className="label">Price (DT)</span><input className="field mt-2" name="priceDt" type="number" step=".001" min="0" required defaultValue={variant ? variant.priceMillimes / 1000 : ""} /></label>
        {!product && <label><span className="label">Starting stock</span><input className="field mt-2" name="initialStock" type="number" min="0" required defaultValue="0" /></label>}
        <label className={product ? "sm:col-span-2" : ""}><span className="label">Image URL</span><input className="field mt-2" name="imageUrls" type="url" required defaultValue={image} placeholder="https://... or /images/watch-1.svg" /></label>
      </div>
      <details className="border-t border-black/10 pt-5"><summary className="cursor-pointer text-sm font-bold">Optional details</summary><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="label">English name</span><input className="field mt-2" name="nameEn" defaultValue={product?.nameEn} /></label><label><span className="label">Reference / SKU</span><input className="field mt-2" name="sku" defaultValue={product?.sku} placeholder="Generated automatically" /></label><label className="sm:col-span-2"><span className="label">Description</span><textarea className="mt-2 min-h-24 w-full rounded-sm border border-black/20 bg-white p-3 text-sm" name="descriptionFr" defaultValue={product?.descriptionFr} placeholder="A short description of this watch" /></label><label><span className="label">Brand</span><input className="field mt-2" name="brand" defaultValue={product?.brand ?? "Hora"} /></label><label><span className="label">Style</span><input className="field mt-2" name="style" defaultValue={product?.style ?? "Classic"} /></label></div></details>
      <input type="hidden" name="slugFr" value={product?.slugFr ?? ""} /><input type="hidden" name="slugEn" value={product?.slugEn ?? ""} /><input type="hidden" name="descriptionEn" value={product?.descriptionEn ?? ""} /><input type="hidden" name="gender" value={product?.gender ?? "Unisex"} /><input type="hidden" name="movement" value={product?.movement ?? "Quartz"} /><input type="hidden" name="caseMaterial" value={product?.caseMaterial ?? "Stainless steel"} /><input type="hidden" name="strapMaterial" value={product?.strapMaterial ?? "Leather"} /><input type="hidden" name="color" value={product?.color ?? "Black"} /><input type="hidden" name="waterResistance" value={product?.waterResistance ?? "5 ATM"} /><input type="hidden" name="variantSku" value={variant?.sku ?? ""} /><input type="hidden" name="variantLabelFr" value={variant?.labelFr ?? "Standard"} /><input type="hidden" name="variantLabelEn" value={variant?.labelEn ?? "Standard"} /><input type="hidden" name="compareAtDt" value={variant?.compareAtPriceMillimes ? variant.compareAtPriceMillimes / 1000 : ""} /><input type="hidden" name="lowStockThreshold" value={variant?.lowStockThreshold ?? 3} /><input type="hidden" name="active" value="on" /><input type="hidden" name="variantActive" value="on" />
      <div className="flex flex-wrap items-center gap-5 text-sm"><label><input type="checkbox" name="featured" defaultChecked={product?.featured} /> Feature on home page</label><button className="rounded-full bg-ink px-6 py-3 font-bold text-white hover:bg-gold-dark">{product ? "Save changes" : "Create product"}</button></div>
    </form>
  );
}
