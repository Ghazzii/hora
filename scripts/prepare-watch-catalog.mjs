import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Source numbers refer to output/product-catalog/source-inventory.json, not
// folder names: several folders contain more than one distinct watch.
const definitions = [
  [
    "calvin-klein-silver",
    "Calvin Klein",
    "Rectangulaire argentée",
    "Silver Rectangle",
    "001 003",
    "003",
    "silver rectangular case, pale silver sunburst minimalist dial with vertical ck Calvin Klein lettering, ornate multi-link silver bracelet",
    "Argent",
    119,
  ],
  [
    "calvin-klein-gold",
    "Calvin Klein",
    "Rectangulaire dorée",
    "Gold Rectangle",
    "002 004",
    "002",
    "gold rectangular case, champagne minimalist sunburst dial with vertical ck Calvin Klein lettering, ornate multi-link gold bracelet",
    "Doré",
    119,
  ],
  [
    "casio-black",
    "Casio",
    "Carrée noire",
    "Black Square",
    "005 006 007 008 010 011 013 015 016 017 018",
    "016",
    "black rounded square case and black linked bracelet, dark analog dial, CASIO lettering at top, narrow inset decorative panel near 6 o'clock, light hands and baton indices",
    "Noir",
    109,
  ],
  [
    "casio-two-tone",
    "Casio",
    "Rectangulaire bicolore",
    "Two-Tone Rectangle",
    "009 012 014",
    "012",
    "small rectangular case with gold bezel, dark blue-black dial with gold hands and hour marks, silver bracelet with gold central links",
    "Bicolore / Bleu",
    99,
  ],
  [
    "dior-gold",
    "Dior",
    "Octogonale dorée",
    "Gold Octagon",
    "019 020 021",
    "021",
    "faceted octagonal gold case, champagne dial with fine hands and Dior lettering, intricate small gold links and distinctive horizontal bars connecting case to bracelet",
    "Doré",
    129,
  ],
  [
    "dior-two-tone",
    "Dior",
    "Octogonale bicolore",
    "Two-Tone Octagon",
    "022 023",
    "022",
    "faceted octagonal gold case, pale silvery dial, intricate silver and gold bracelet with horizontal gold connectors to case",
    "Bicolore",
    129,
  ],
  [
    "ferragamo-gold",
    "Ferragamo",
    "Maillons dorés",
    "Gold Links",
    "024 025",
    "025",
    "small gold square case, very dark green-black dial, gold hands and markers, large open geometric and rounded gold chain links",
    "Doré / Vert foncé",
    139,
  ],
  [
    "gucci-green",
    "Gucci",
    "Carrée verte",
    "Green Square",
    "026 027 029",
    "027",
    "rounded square gold case, deep green dial with gold hands and markers, fine woven chevron-pattern gold bracelet and rectangular gold connectors",
    "Doré / Vert",
    139,
  ],
  [
    "gucci-round",
    "Gucci",
    "Ronde bicolore",
    "Two-Tone Round",
    "028 030",
    "028",
    "small round gold bezel with raised engraved letter details, dark grey-black dial, gold hands, silver and gold multi-link bracelet",
    "Bicolore / Noir",
    139,
  ],
  [
    "rolex-rectangle",
    "Rolex",
    "Rectangulaire dorée",
    "Gold Rectangle",
    "031 032",
    "031",
    "gold rectangular beveled case, dark dial, gold baton indices and hands, crown emblem and Rolex dial lettering exactly as reference, fine gold multi-row bracelet",
    "Doré / Noir",
    149,
  ],
  [
    "snille-black-silver",
    "Snille",
    "Cadran noir argenté",
    "Silver Black Dial",
    "033 034 035 038 043 045 046 048",
    "034",
    "large polished silver round case, black patterned multi-subdial dial with SNILLE lettering at right, silver baton markers, three subdial pattern, date near 4 o'clock, silver crown and two pushers, black stitched strap",
    "Argent / Noir",
    119,
  ],
  [
    "snille-white-silver",
    "Snille",
    "Cadran blanc argenté",
    "Silver White Dial",
    "036 037 039 041 042",
    "042",
    "polished silver round case, white dial with multiple subdials and silver baton markers, silver crown and two pushers, dark charcoal olive stitched strap",
    "Argent / Blanc",
    119,
  ],
  [
    "snille-white-black",
    "Snille",
    "Cadran blanc boîtier noir",
    "Black Case White Dial",
    "040 044 047",
    "044",
    "BLACK round case with black crown and two black pushers, white patterned dial with three subdial pattern, fine silver baton markers and SNILLE lettering, dark brown stitched strap",
    "Noir / Blanc",
    119,
  ],
  [
    "sunlifex-hexagon",
    "Sunlifex",
    "Hexagonale dorée",
    "Gold Hexagon",
    "049 050 051",
    "050",
    "small hexagonal gold case, pale silver dial, fine gold hands, broad open hexagonal gold bracelet links, SUNLIFEX lettering as visible",
    "Doré",
    99,
  ],
  [
    "swan-turquoise",
    "Swarovski",
    "Rectangulaire turquoise",
    "Turquoise Rectangle",
    "052 053",
    "053",
    "slender rectangular gold case, turquoise blue dial with gold markers and hands, wide intricate openwork gold bracelet with decorative filigree panels",
    "Doré / Turquoise",
    109,
  ],
  [
    "tory-two-tone",
    "Tory Burch",
    "Rectangulaire bicolore",
    "Two-Tone Rectangle",
    "054 055",
    "055",
    "small rectangular GOLD bezel and pale champagne dial with small round emblem near 12 o'clock, articulated narrow silver bracelet with gold decorative central motifs",
    "Bicolore",
    119,
  ],
  [
    "tory-silver",
    "Tory Burch",
    "Rectangulaire argentée",
    "Silver Rectangle",
    "056 057",
    "056",
    "small rectangular SILVER case, pale white dial with small round emblem near 12 o'clock, articulated narrow silver bracelet and rectangular open connectors at lugs",
    "Argent",
    119,
  ],
  [
    "versace-green",
    "Versace",
    "Ronde verte",
    "Green Round",
    "058 062",
    "058",
    "gold round case with fine fluted bezel, emerald green dial, gold hands and hour indices, broad gold bracelet with raised repeating Greek key square patterns",
    "Doré / Vert",
    149,
  ],
  [
    "versace-champagne",
    "Versace",
    "Ronde champagne",
    "Champagne Round",
    "059 060 061 063",
    "063",
    "gold round case with fine fluted bezel, pale champagne dial, gold hands and hour indices, broad gold bracelet with raised repeating Greek key square patterns",
    "Doré / Champagne",
    149,
  ],
];

const inventory = JSON.parse(
  await fs.readFile("output/product-catalog/source-inventory.json", "utf8"),
);
const byId = new Map(inventory.map((item) => [item.id, item]));
const shots = [
  {
    key: "01-studio",
    en: "Studio view",
    fr: "Vue studio",
    direction:
      "Full watch upright on a minimal ivory suede cushion, nearly frontal with slight natural three-quarter angle, seamless warm ivory studio background and soft natural shadow. Entire case and bracelet comfortably visible.",
  },
  {
    key: "02-angle",
    en: "Angled view",
    fr: "Vue de trois quarts",
    direction:
      "Full watch resting around an understated neutral suede cushion, three-quarter side angle emphasizing the case and bracelet construction, warm grey studio background and refined directional softbox light. Entire watch comfortably visible.",
  },
  {
    key: "03-detail",
    en: "Dial detail",
    fr: "Détail du cadran",
    direction:
      "Close-up macro photograph of the existing dial, bezel, crown and upper bracelet links. Preserve the photographed dial geometry exactly. Soft controlled reflection, warm light grey background. Never invent lettering or extra dial elements.",
  },
  {
    key: "04-editorial",
    en: "Editorial view",
    fr: "Vue éditoriale",
    direction:
      "Full watch arranged elegantly on a warm limestone plinth with subtle beige linen in background, natural window light, quiet premium editorial still life. Show case and bracelet clearly. No props that conceal the product.",
  },
];

await fs.mkdir("data", { recursive: true });
const genders = JSON.parse(
  await fs.readFile("data/watch-genders.json", "utf8"),
);
const products = [];
const jobs = [];
for (const [
  slug,
  brand,
  nameFr,
  nameEn,
  ids,
  primary,
  identity,
  color,
  price,
] of definitions) {
  const sources = ids.split(" ").map((id) => byId.get(id));
  if (sources.some((source) => !source))
    throw new Error(`Unknown source: ${slug}`);
  const target = `public/images/products/${slug}`;
  await fs.mkdir(target, { recursive: true });
  const source = byId.get(primary);
  await sharp(source.path)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(`${target}/reference.webp`);
  const product = {
    slug,
    sku: `HP-${slug.toUpperCase()}`,
    brand,
    nameFr: `${brand} — ${nameFr}`,
    nameEn: `${brand} — ${nameEn}`,
    descriptionFr: `${brand} — ${nameFr}. Une montre sélectionnée pour sa silhouette et les détails de son bracelet. Les caractéristiques techniques restent à confirmer.`,
    descriptionEn: `${brand} — ${nameEn}. Selected for its silhouette and bracelet details. Technical specifications are pending confirmation.`,
    color,
    category: "classiques",
    gender: genders.products[slug] ?? "Unisexe",
    movement: "À confirmer",
    caseMaterial: "À confirmer",
    strapMaterial: "À confirmer",
    waterResistance: "À confirmer",
    style: slug.startsWith("snille") ? "Sport" : "Classique",
    priceMillimes: price * 1000,
    stock: 10,
    exampleCommercialValues: true,
    featured: [
      "calvin-klein-silver",
      "casio-black",
      "gucci-green",
      "snille-black-silver",
      "swan-turquoise",
      "versace-green",
    ].includes(slug),
    identity,
    primarySourceId: primary,
    sources,
    reference: `/images/products/${slug}/reference.webp`,
    images: shots.map((shot) => ({
      url: `/images/products/${slug}/${shot.key}.webp`,
      altFr: `${brand} ${nameFr} — ${shot.fr}`,
      altEn: `${brand} ${nameEn} — ${shot.en}`,
    })),
  };
  products.push(product);
  for (const shot of shots) {
    jobs.push({
      slug,
      shot: shot.key,
      sourcePath: path.resolve(source.path),
      destination: `${target}/${shot.key}.webp`,
      prompt: `Use case: precise-object-edit. Asset type: ecommerce product photograph for Hora. Edit target: ONLY the watch on the cushion in the reference; ignore any watch on the person's wrist or in the shop background. Make ONE premium photorealistic product photo, portrait 4:5 composition. ${shot.direction} Product identity that must remain unchanged: ${identity}. Reference photo is the sole authority for the product. Preserve its exact case shape, finish, dial colour, hands, hour markers, subdials, crown, pushers, bracelet links, strap, and visible lettering. Remove the hand, tags, shop and floor; only improve background, light and photographic presentation. Do not redesign or upgrade the watch. No other watches, no extra features, no invented accessories, no overlay text or watermark. For full views leave 15% empty margin around the watch for responsive cropping. Natural materials, faithful colour and convincing optical detail.`,
    });
  }
}
const assigned = products.flatMap((product) =>
  product.sources.map((source) => source.id),
);
if (
  assigned.length !== inventory.length ||
  new Set(assigned).size !== inventory.length
)
  throw new Error("Every original must belong to exactly one watch.");
await fs.writeFile(
  "data/watch-catalog.json",
  JSON.stringify(
    {
      version: 1,
      note: "Prices and stock are example values authorized by the owner. Brands are transcribed from source folders/photos; technical specifications are unverified. Each finish is a separate product because galleries are product-level.",
      products,
    },
    null,
    2,
  ) + "\n",
);
await fs.writeFile(
  "output/product-catalog/generation-jobs.json",
  JSON.stringify(jobs, null, 2) + "\n",
);
console.log(
  `${products.length} distinct watches, ${inventory.length} original photos, ${jobs.length} requested images.`,
);
