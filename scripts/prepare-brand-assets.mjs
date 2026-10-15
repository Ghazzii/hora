import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Crop and optimize the owner's artwork; never redraw the official logo.
const directory = "public/images/brand";
await fs.mkdir(directory, { recursive: true });
const source = path.join(directory, "hora-original.jpeg");
if (process.argv[2]) await fs.copyFile(process.argv[2], source);

async function crop(name, region) {
  await sharp(source).extract(region).webp({ quality: 92 }).toFile(path.join(directory, name));
}

async function transparentLogo(name, region, dark = false) {
  const { data, info } = await sharp(source).extract(region).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const rgb = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
    const coverage = dark ? 1 - Math.min(...rgb) / 235 : Math.max(...rgb) / 255;
    const alpha = coverage < 0.06 ? 0 : Math.min(1, coverage);
    for (let channel = 0; channel < 3; channel++) {
      pixels[i * 4 + channel] = dark ? 11 : alpha ? Math.min(255, Math.round(rgb[channel] / alpha)) : 0;
    }
    pixels[i * 4 + 3] = Math.round(alpha * 255);
  }
  await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(path.join(directory, name));
}

await transparentLogo("hora-mark-gold.png", { left: 391, top: 70, width: 476, height: 505 });
await transparentLogo("hora-wordmark-gold.png", { left: 425, top: 605, width: 410, height: 51 });
await transparentLogo("hora-mark-black.png", { left: 120, top: 798, width: 155, height: 159 }, true);
await transparentLogo("hora-wordmark-black.png", { left: 118, top: 970, width: 159, height: 25 }, true);
await crop("hora-signature.webp", { left: 340, top: 36, width: 580, height: 700 });
await crop("hora-embossed.webp", { left: 837, top: 773, width: 417, height: 269 });
await crop("hora-packaging.webp", { left: 0, top: 1046, width: 297, height: 208 });
await crop("hora-crown.webp", { left: 300, top: 1046, width: 298, height: 208 });
await crop("hora-dial.webp", { left: 604, top: 1046, width: 283, height: 208 });

const mark = await sharp(path.join(directory, "hora-mark-gold.png")).resize(144, 152, { fit: "contain" }).toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 3, background: "#000000" } }).composite([{ input: mark, left: 18, top: 14 }]).png().toFile("public/apple-touch-icon.png");
await sharp("public/apple-touch-icon.png").resize(64, 64).png().toFile("public/favicon.png");
const signature = await sharp(path.join(directory, "hora-signature.webp")).resize({ height: 570 }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#000000" } }).composite([{ input: signature, gravity: "centre" }]).jpeg({ quality: 92 }).toFile(path.join(directory, "hora-social.jpg"));
console.log("Official HORA logo, brand photography, icons and social image prepared.");
