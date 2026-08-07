import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

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

const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: {
    where: { active: true },
    orderBy: { priceMillimes: "asc" as const },
  },
  reviews: {
    where: { status: "APPROVED" as const },
    include: { user: { select: { firstName: true } } },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.ProductInclude;

export async function getCatalog(query: CatalogQuery = {}) {
  const pageSize = Math.min(24, Math.max(1, query.pageSize ?? 12));
  const page = Math.max(1, query.page ?? 1);
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
    ...((query.minPrice || query.maxPrice || query.available)
      ? {
          variants: {
            some: {
              active: true,
              ...(query.minPrice
                ? { priceMillimes: { gte: query.minPrice } }
                : {}),
              ...(query.maxPrice
                ? { priceMillimes: { lte: query.maxPrice } }
                : {}),
              ...(query.available ? { stock: { gt: 0 } } : {}),
            },
          },
        }
      : {}),
  };

  const products = await db.product.findMany({ where, include: productInclude });
  products.sort((a, b) => {
    if (query.sort === "price-asc") {
      return (a.variants[0]?.priceMillimes ?? Infinity) -
        (b.variants[0]?.priceMillimes ?? Infinity);
    }
    if (query.sort === "price-desc") {
      return (b.variants[0]?.priceMillimes ?? 0) -
        (a.variants[0]?.priceMillimes ?? 0);
    }
    if (query.sort === "rating") return b.averageRating - a.averageRating;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return {
    items: products.slice((page - 1) * pageSize, page * pageSize),
    total: products.length,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(products.length / pageSize)),
  };
}

export function getFeaturedProducts(limit = 6) {
  return db.product.findMany({
    where: { active: true, featured: true },
    include: productInclude,
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
    include: productInclude,
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
