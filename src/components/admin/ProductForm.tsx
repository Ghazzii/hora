import type { Category, Product, ProductImage, ProductVariant } from "@prisma/client";
import { addVariantAction, saveProductAction } from "@/features/admin/actions";
import { formatTnd } from "@/lib/money";

type FullProduct = Product & { images: ProductImage[]; variants: ProductVariant[] };

export function ProductForm({ product, categories }: { product?: FullProduct | null; categories: Category[] }) {
  const variant = product?.variants[0];
  const fields = [
    ["brand", "Brand", product?.brand ?? "Hora"],
    ["gender", "Gender", product?.gender ?? "Unisex"],
    ["movement", "Movement", product?.movement ?? "Quartz"],
    ["caseMaterial", "Case material", product?.caseMaterial ?? "Stainless steel"],
    ["strapMaterial", "Strap material", product?.strapMaterial ?? "Leather"],
    ["style", "Style", product?.style ?? "Classic"],
    ["color", "Color", product?.color ?? "Black"],
    ["waterResistance", "Water resistance", product?.waterResistance ?? "5 ATM"],
  ];
  return (
    <div className="space-y-6">
      <form action={saveProductAction} className="admin-card grid gap-5">
        {product && <input type="hidden" name="productId" value={product.id} />}
        {variant && <input type="hidden" name="variantId" value={variant.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="label">Name FR</span><input className="field mt-2" name="nameFr" required defaultValue={product?.nameFr} /></label>
          <label><span className="label">Name EN</span><input className="field mt-2" name="nameEn" required defaultValue={product?.nameEn} /></label>
          <label><span className="label">Slug FR</span><input className="field mt-2" name="slugFr" defaultValue={product?.slugFr} /></label>
          <label><span className="label">Slug EN</span><input className="field mt-2" name="slugEn" defaultValue={product?.slugEn} /></label>
          <label><span className="label">Product SKU</span><input className="field mt-2" name="sku" required defaultValue={product?.sku} /></label>
          <label><span className="label">Category</span><select className="field mt-2" name="categoryId" required defaultValue={product?.categoryId ?? ""}><option value="" disabled>Choose</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nameFr}</option>)}</select></label>
        </div>
        <label><span className="label">Description FR</span><textarea className="mt-2 min-h-28 w-full border bg-white p-3" name="descriptionFr" required minLength={20} defaultValue={product?.descriptionFr} /></label>
        <label><span className="label">Description EN</span><textarea className="mt-2 min-h-28 w-full border bg-white p-3" name="descriptionEn" required minLength={20} defaultValue={product?.descriptionEn} /></label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{fields.map(([name, label, value]) => <label key={name}><span className="label">{label}</span><input className="field mt-2" name={name} required defaultValue={value} /></label>)}</div>
        <label><span className="label">Image URLs, one per line</span><textarea className="mt-2 min-h-24 w-full border bg-white p-3 font-mono text-sm" name="imageUrls" defaultValue={product?.images.map((image) => image.url).join("\n") ?? "/images/watch-1.svg"} /></label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className="label">Variant SKU</span><input className="field mt-2" name="variantSku" required defaultValue={variant?.sku ?? ""} /></label>
          <label><span className="label">Variant label FR</span><input className="field mt-2" name="variantLabelFr" required defaultValue={variant?.labelFr ?? "Standard"} /></label>
          <label><span className="label">Variant label EN</span><input className="field mt-2" name="variantLabelEn" required defaultValue={variant?.labelEn ?? "Standard"} /></label>
          <label><span className="label">Price DT</span><input className="field mt-2" name="priceDt" type="number" step=".001" min="0" required defaultValue={variant ? variant.priceMillimes / 1000 : ""} /></label>
          <label><span className="label">Compare price DT</span><input className="field mt-2" name="compareAtDt" type="number" step=".001" min="0" defaultValue={variant?.compareAtPriceMillimes ? variant.compareAtPriceMillimes / 1000 : ""} /></label>
          {!product && <label><span className="label">Initial stock</span><input className="field mt-2" name="initialStock" type="number" min="0" required defaultValue="0" /></label>}
          <label><span className="label">Low-stock threshold</span><input className="field mt-2" name="lowStockThreshold" type="number" min="0" required defaultValue={variant?.lowStockThreshold ?? 3} /></label>
        </div>
        <div className="flex flex-wrap gap-5 text-sm"><label><input type="checkbox" name="featured" defaultChecked={product?.featured} /> Featured</label><label><input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Product active</label><label><input type="checkbox" name="variantActive" defaultChecked={variant?.active ?? true} /> Variant active</label></div>
        <button className="justify-self-start bg-ink px-6 py-3 font-bold text-white">{product ? "Save product" : "Create product"}</button>
      </form>
      {product && (
        <section className="admin-card">
          <h2 className="font-display text-2xl">Variants</h2>
          <ul className="mt-4 divide-y">{product.variants.map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><span><strong>{item.sku}</strong> · {item.labelFr}</span><span>{formatTnd(item.priceMillimes)} · Stock {item.stock}</span></li>)}</ul>
          <form action={addVariantAction} className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-5">
            <input type="hidden" name="productId" value={product.id} />
            <input className="field" name="sku" required placeholder="SKU" />
            <input className="field" name="labelFr" required placeholder="Label FR" />
            <input className="field" name="labelEn" required placeholder="Label EN" />
            <input className="field" name="priceDt" type="number" step=".001" min="0" required placeholder="Price DT" />
            <input className="field" name="stock" type="number" min="0" required placeholder="Stock" />
            <button className="bg-ink px-4 py-2 font-bold text-white sm:col-span-5">Add variant</button>
          </form>
        </section>
      )}
    </div>
  );
}
