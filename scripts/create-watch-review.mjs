import fs from "node:fs/promises";

const { products } = JSON.parse(
  await fs.readFile("data/watch-catalog.json", "utf8"),
);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const labels = [
  "Original reference",
  "01 / Studio",
  "02 / Angle",
  "03 / Dial detail",
  "04 / Editorial",
];
const cards = products
  .map(
    (
      product,
      index,
    ) => `<section class="watch" data-search="${escape(`${product.nameEn} ${product.nameFr} ${product.sku}`.toLowerCase())}" data-brand="${escape(product.brand)}">
  <div class="watch-heading"><div><p class="eyebrow">${String(index + 1).padStart(2, "0")} / ${escape(product.brand)}</p><h2>${escape(product.nameEn)}</h2><p class="sources">Source photos ${product.sources.map((source) => source.id).join(" · ")}</p></div><span class="finish">${escape(product.color)}</span></div>
  <div class="photos">${[{ url: product.reference, altEn: `${product.nameEn}, original reference` }, ...product.images].map((photo, photoIndex) => `<figure><a href="../../public${escape(photo.url)}" target="_blank" rel="noreferrer"><img src="../../public${escape(photo.url)}" alt="${escape(photo.altEn)}" loading="lazy" width="400" height="500"></a><figcaption>${labels[photoIndex]}</figcaption></figure>`).join("")}</div>
</section>`,
  )
  .join("\n");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hora — Watch photo review</title><style>
*{box-sizing:border-box}body{margin:0;background:#f6f3ed;color:#26251f;font:15px/1.6 Arial,sans-serif}main{max-width:1500px;margin:auto;padding:44px 32px 70px}.brand{font:24px Georgia,serif;letter-spacing:.24em}.eyebrow{margin:0;font-size:10px;text-transform:uppercase;letter-spacing:.2em;color:#8a774f}header{border-bottom:1px solid #ddd6c8;padding-bottom:32px}h1{font:clamp(38px,6vw,76px)/1.05 Georgia,serif;letter-spacing:-.035em;max-width:800px;margin:38px 0 22px}header>p{max-width:760px;color:#666456}h2{font:27px/1.2 Georgia,serif;margin:6px 0}.toolbar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:28px 0}input,select{font:inherit;padding:12px 16px;border:1px solid #d9d2c5;border-radius:9px;background:#fff;color:inherit}input{width:min(380px,100%)}.count{margin-left:auto;color:#777164;font-size:13px}.watch{padding:26px;margin:0 0 26px;background:#fff;border:1px solid #e7e1d7;border-radius:18px}.watch-heading{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px}.sources{margin:5px 0 0;color:#898274;font-size:11px}.finish{font-size:12px;border:1px solid #e1dacd;border-radius:24px;padding:6px 14px;white-space:nowrap}.photos{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}figure{margin:0}figure:first-child img{border:1px solid #d4bea0}img{display:block;width:100%;height:auto;aspect-ratio:4/5;object-fit:contain;background:#f1ece2;border-radius:10px}figcaption{margin-top:9px;font-size:11px;color:#827b6c}a:focus-visible{outline:2px solid #ad8f4c;outline-offset:4px}footer{margin-top:30px;color:#827b6c;font-size:12px}[hidden]{display:none!important}@media(max-width:900px){.photos{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:560px){main{padding:25px 16px}.watch{padding:16px}.photos{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.watch-heading{align-items:flex-start}.finish{display:none}h2{font-size:23px}.count{width:100%;margin-left:0}h1{margin-top:28px}}
</style></head><body><main><header><div class="brand">HORA</div><p class="eyebrow" style="margin-top:32px">The collection / Photography review</p><h1>Same watches.<br><em>A clearer perspective.</em></h1><p>${products.length} watches and finishes, with four new images each. Compare every set with its original reference. Select a photo to inspect it at full size.</p><p style="font-size:12px">AI-generated photography may vary in fine lettering and small details. The originals remain the reference. Prices and stock in the app are editable example values.</p></header>
<div class="toolbar"><label><span class="eyebrow">Find a watch</span><br><input id="search" type="search" placeholder="Brand, finish or watch name"></label><label><span class="eyebrow">Brand</span><br><select id="brand"><option value="">All brands</option>${[
  ...new Set(products.map((product) => product.brand)),
]
  .sort()
  .map((brand) => `<option>${escape(brand)}</option>`)
  .join(
    "",
  )}</select></label><p id="count" class="count" aria-live="polite">${products.length} watches / ${products.length * 4} new images</p></div>
${cards}<p id="empty" hidden>No watches match this search.</p><footer>Hora · Built-in image generation · Original photos preserved · Studio, angle, dial and editorial views</footer></main>
<script>const search=document.getElementById('search'),brand=document.getElementById('brand'),cards=[...document.querySelectorAll('.watch')];function filter(){const query=search.value.trim().toLowerCase();let count=0;for(const card of cards){card.hidden=!(card.dataset.search.includes(query)&&(!brand.value||card.dataset.brand===brand.value));if(!card.hidden)count++}document.getElementById('count').textContent=count+' watches / '+count*4+' new images';document.getElementById('empty').hidden=count!==0}search.addEventListener('input',filter);brand.addEventListener('change',filter);</script></body></html>`;
await fs.writeFile("output/product-catalog/review.html", html);
console.log("Saved output/product-catalog/review.html");
