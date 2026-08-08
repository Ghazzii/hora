import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { locales } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const products = await db.product.findMany({
    where: { active: true },
    select: { slugFr: true, slugEn: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const staticPaths = [
    { path: "", priority: 1 },
    { path: "/montres", priority: 0.9 },
    { path: "/recherche", priority: 0.7 },
    { path: "/a-propos", priority: 0.5 },
    { path: "/livraison-retours", priority: 0.5 },
    { path: "/contact", priority: 0.5 },
  ] as const;

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPaths.map(({ path, priority }) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "/montres" ? "daily" : "weekly",
      priority,
    })),
  );
  const productEntries: MetadataRoute.Sitemap = products.flatMap((product) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/montres/${
        locale === "fr" ? product.slugFr : product.slugEn
      }`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
  );

  return [...staticEntries, ...productEntries];
}
