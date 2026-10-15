import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { catalogVariantWhere } from "@/lib/catalog-filters";
import { CATALOG_TAG } from "@/lib/cache";

// Catalog reads are shared across visitors for a few minutes and cleared on every
// stock, product or review change. Checkout always re-reads stock and prices itself.
// Cached values are JSON-serialized, so Date fields arrive as ISO strings.
function cached<Args extends unknown[], Result>(name: string, fn: (...args: Args) => Promise<Result>) {
  return unstable_cache(fn, [name], { tags: [CATALOG_TAG], revalidate: 300 });
}

export type CatalogQuery = {
  search?: string;
  category?: string;
  brand?: string;
  gender?: string;
  movement?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  sort?: "newest" | "rating" | "price-asc" | "price-desc";
  page?: number;
  pageSize?: number;
};

const cardInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: {
    where: { active: true },
    orderBy: { priceMillimes: "asc" as const },
  },
} satisfies Prisma.ProductInclude;

const productInclude = {
  ...cardInclude,
  category: true,
  reviews: {
    where: { status: "APPROVED" as const },
    include: { user: { select: { firstName: true } } },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.ProductInclude;

async function loadCatalog(query: CatalogQuery = {}) {
  const pageSize = Math.min(24, Math.max(1, query.pageSize ?? 12));
  const requestedPage = Number.isFinite(query.page) ? Math.max(1, Math.floor(query.page ?? 1)) : 1;
  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(query.search
      ? {
          OR: [
            { nameFr: { contains: query.search, mode: "insensitive" } },
            { nameEn: { contains: query.search, mode: "insensitive" } },
            { brand: { contains: query.search, mode: "insensitive" } },
            { sku: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.category
      ? {
          category: {
            OR: [{ slugFr: query.category }, { slugEn: query.category }],
          },
        }
      : {}),
    ...(query.brand ? { brand: query.brand } : {}),
    ...(query.gender ? { gender: query.gender } : {}),
    ...(query.movement ? { movement: query.movement } : {}),
    ...((query.minPrice !== undefined || query.maxPrice !== undefined || query.available)
      ? {
          variants: {
            some: catalogVariantWhere(query),
          },
        }
      : {}),
  };

  const filteredInclude = {
    ...cardInclude,
    variants: {
      ...cardInclude.variants,
      where: catalogVariantWhere(query),
    },
  } satisfies Prisma.ProductInclude;

  if (query.sort !== "price-asc" && query.sort !== "price-desc") {
    const total = await db.product.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, pageCount);
    const items = await db.product.findMany({
      where,
      include: filteredInclude,
      orderBy: query.sort === "rating"
        ? [{ averageRating: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize, pageCount };
  }

  const products = await db.product.findMany({ where, include: filteredInclude });
  products.sort((a, b) => {
    if (query.sort === "price-asc") {
      return (a.variants[0]?.priceMillimes ?? Infinity) -
        (b.variants[0]?.priceMillimes ?? Infinity);
    }
    if (query.sort === "price-desc") {
      return (b.variants[0]?.priceMillimes ?? 0) -
        (a.variants[0]?.priceMillimes ?? 0);
    }
    return 0;
  });

  const pageCount = Math.max(1, Math.ceil(products.length / pageSize));
  // Never return a blank catalog merely because a stale or hand-written URL
  // requests a page beyond the filtered result set.
  const page = Math.min(requestedPage, pageCount);

  return {
    items: products.slice((page - 1) * pageSize, page * pageSize),
    total: products.length,
    page,
    pageSize,
    pageCount,
  };
}

export const getCatalog = cached("catalog", loadCatalog);

export const getFeaturedProducts = cached("featured", async (limit: number = 6) => {
  const featured = await db.product.findMany({
    where: { active: true, featured: true },
    include: cardInclude,
    orderBy: [{ averageRating: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  if (featured.length >= Math.min(limit, 3)) return featured;
  // A new store may not have marked anything as featured yet: fall back to the newest watches.
  return db.product.findMany({
    where: { active: true },
    include: cardInclude,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
});

export const getProductBySlug = cached("product", (slug: string) =>
  db.product.findFirst({
    where: {
      active: true,
      OR: [{ slugFr: slug }, { slugEn: slug }],
    },
    include: productInclude,
  }),
);

export const getRelatedProducts = cached("related", (categoryId: string, productId: string) =>
  db.product.findMany({
    where: { active: true, categoryId, id: { not: productId } },
    include: cardInclude,
    orderBy: [{ featured: "desc" }, { averageRating: "desc" }],
    take: 4,
  }),
);

export const getCatalogFacets = cached("facets", loadFacets);

async function loadFacets() {
  const [brands, genders] = await Promise.all([
    db.product.findMany({ where: { active: true }, distinct: ["brand"], select: { brand: true } }),
    db.product.findMany({ where: { active: true }, distinct: ["gender"], select: { gender: true } }),
  ]);
  return {
    brands: brands.map((item) => item.brand),
    genders: genders.map((item) => item.gender),
  };
}
