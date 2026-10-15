import { revalidateTag } from "next/cache";

/** Tag on every cached storefront catalog read (products, stock, prices, reviews). */
export const CATALOG_TAG = "catalog";

/** Call after anything that changes what shoppers see: products, prices, stock or approved reviews. */
export function revalidateCatalog() {
  try {
    revalidateTag(CATALOG_TAG);
  } catch {
    // Outside a Next.js request (scripts, tests) there is no cache to clear.
  }
}
