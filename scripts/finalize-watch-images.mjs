import fs from "node:fs/promises";
import sharp from "sharp";

const { products } = JSON.parse(
  await fs.readFile("data/watch-catalog.json", "utf8"),
);
let complete = 0;
const missing = [];
for (const product of products) {
  const tiles = [];
  for (let index = 0; index < product.images.length; index++) {
    const image = product.images[index];
    const filename = image.url.split("/").at(-1).replace(".webp", ".png");
    const original = `output/product-catalog/generated/${product.slug}-${filename}`;
    try {
      await fs.access(original);
    } catch {
      missing.push(`${product.slug}/${filename}`);
      continue;
    }
    await sharp(original)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 90, effort: 5 })
      .toFile(`public${image.url}`);
    complete++;
    tiles.push({
      input: await sharp(`public${image.url}`)
        .resize(260, 325, { fit: "contain", background: "#f5f0e7" })
        .png()
        .toBuffer(),
      top: 0,
      left: index * 260,
    });
  }
  if (tiles.length === 4)
    await sharp({
      create: { width: 1040, height: 325, channels: 3, background: "#f5f0e7" },
    })
      .composite(tiles)
      .jpeg({ quality: 90 })
      .toFile(`output/product-catalog/review/${product.slug}-final.jpg`);
}
console.log(
  JSON.stringify({ complete, expected: products.length * 4, missing }),
);
if (missing.length) process.exitCode = 1;
