import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { catalogVariantWhere } from "@/lib/catalog-filters";

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

export async function getCatalog(query: CatalogQuery = {}) {
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

export function getFeaturedProducts(limit = 6) {
  return db.product.findMany({
    where: { active: true, featured: true },
    include: cardInclude,
    orderBy: [{ averageRating: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export function getProductBySlug(slug: string) {
  return db.product.findFirst({
    where: {
      active: true,
      OR: [{ slugFr: slug }, { slugEn: slug }],
    },
    include: productInclude,
  });
}

export function getRelatedProducts(categoryId: string, productId: string) {
  return db.product.findMany({
    where: { active: true, categoryId, id: { not: productId } },
    include: cardInclude,
    take: 4,
  });
}

export async function getCatalogFacets() {
  const [categories, brands, genders, movements] = await Promise.all([
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.product.findMany({ where: { active: true }, distinct: ["brand"], select: { brand: true } }),
    db.product.findMany({ where: { active: true }, distinct: ["gender"], select: { gender: true } }),
    db.product.findMany({ where: { active: true }, distinct: ["movement"], select: { movement: true } }),
  ]);
  return {
    categories,
    brands: brands.map((item) => item.brand),
    genders: genders.map((item) => item.gender),
    movements: movements.map((item) => item.movement),
  };
}
