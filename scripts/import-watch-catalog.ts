import "dotenv/config";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

type Watch = {
  slug: string;
  sku: string;
  category: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  brand: string;
  gender: string;
  movement: string;
  caseMaterial: string;
  strapMaterial: string;
  style: string;
  color: string;
  waterResistance: string;
  featured: boolean;
  priceMillimes: number;
  stock: number;
  images: { url: string; altFr: string; altEn: string }[];
};

async function main() {
  const apply = process.argv.includes("--apply");
  const publish = process.argv.includes("--publish");
  const catalog = JSON.parse(
    await readFile("data/watch-catalog.json", "utf8"),
  ) as { products: Watch[] };
  // Validate everything before any database write. Never import a broken gallery.
  const skus = new Set<string>();
  for (const product of catalog.products) {
    if (skus.has(product.sku) || !/^[a-z0-9-]+$/.test(product.slug))
      throw new Error(`Invalid identity: ${product.sku}`);
    skus.add(product.sku);
    if (
      product.images.length !== 4 ||
      new Set(product.images.map((image) => image.url)).size !== 4
    )
      throw new Error(`${product.sku} requires four different images.`);
    if (
      !Number.isSafeInteger(product.priceMillimes) ||
      product.priceMillimes <= 0 ||
      !Number.isSafeInteger(product.stock) ||
      product.stock < 0
    )
      throw new Error(`Invalid price or stock: ${product.sku}`);
    for (const image of product.images) {
      if (
        !image.url.startsWith(`/images/products/${product.slug}/`) ||
        image.url.includes("..")
      )
        throw new Error(`Invalid photo mapping: ${product.sku}`);
      await access(path.join("public", image.url));
    }
  }
  if (!apply) {
    console.log(
      `Validated ${catalog.products.length} watches and ${catalog.products.length * 4} photos. No database changes. Use --apply to create drafts; --apply --publish to create visible products after deploying the images.`,
    );
    return;
  }

  const db = new PrismaClient();
  try {
    const summary = await db.$transaction(
      async (tx) => {
        const category = await tx.category.upsert({
          where: { slugFr: "classiques" },
          update: {},
          create: {
            slugFr: "classiques",
            slugEn: "classic",
            nameFr: "Classiques",
            nameEn: "Classic",
          },
        });
        let created = 0;
        let skipped = 0;
        for (const product of catalog.products) {
          if (
            await tx.product.findUnique({
              where: { sku: product.sku },
              select: { id: true },
            })
          ) {
            skipped++;
            continue;
          }
          const {
            slug,
            sku,
            nameFr,
            nameEn,
            descriptionFr,
            descriptionEn,
            brand,
            gender,
            movement,
            caseMaterial,
            strapMaterial,
            style,
            color,
            waterResistance,
            featured,
            priceMillimes,
            stock,
            images,
          } = product;
          await tx.product.create({
            data: {
              sku,
              slugFr: slug,
              slugEn: slug,
              categoryId: category.id,
              nameFr,
              nameEn,
              descriptionFr,
              descriptionEn,
              brand,
              gender,
              movement,
              caseMaterial,
              strapMaterial,
              style,
              color,
              waterResistance,
              featured,
              active: publish,
              images: {
                create: images.map((image, sortOrder) => ({
                  ...image,
                  sortOrder,
                })),
              },
              variants: {
                create: {
                  sku: `${sku}-STD`,
                  labelFr: "Modèle photographié",
                  labelEn: "Photographed model",
                  attributes: { color },
                  priceMillimes,
                  stock,
                  inventoryMovements: {
                    create: {
                      delta: stock,
                      reason: "ADMIN_ADJUSTMENT",
                      note: "Hora pics import: owner-authorized example starting stock; verify before launch.",
                    },
                  },
                },
              },
            },
          });
          created++;
        }
        return {
          created,
          skipped,
          visibility: publish ? "visible" : "draft",
          examplePricesAndStock: true,
        };
      },
      { timeout: 60_000 },
    );
    console.log(JSON.stringify(summary));
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Do not print connection strings or Prisma's full environment-bearing errors.
  console.error(
    error instanceof Error &&
      !/prisma|connection|database|postgres/i.test(error.message)
      ? error.message
      : "Catalog import failed; no partial catalog was committed. Check database connectivity and schema.",
  );
  process.exitCode = 1;
});
