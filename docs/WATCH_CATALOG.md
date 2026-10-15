# Hora photo catalog

The `hora pics` collection contains 63 original photos of **19 distinct watches/finishes**. The `- Chatgpt` folders contain duplicate originals except for three previously generated Calvin Klein photos. Those three are retained as references, not treated as additional products.

`data/watch-catalog.json` maps every original photo to exactly one product. Each watch has its own SKU, gallery and source IDs. Separate finishes are separate products because the current schema attaches photos to products rather than variants. In particular:

| Source folder | Distinct watches/finishes                                             |
| ------------- | --------------------------------------------------------------------- |
| calvin clein  | Silver rectangle; gold rectangle                                      |
| casio         | Black rounded square; two-tone rectangle                              |
| dior          | Gold octagon; two-tone octagon                                        |
| ferrgamo      | Gold square with open chain links                                     |
| gucci         | Green square; dark round two-tone                                     |
| rolex         | Gold rectangle with dark dial                                         |
| Snille        | Black dial/silver case; white dial/silver case; white dial/black case |
| sunlifex      | Gold hexagon                                                          |
| swan          | Gold rectangle with turquoise dial                                    |
| tory          | Two-tone rectangle; silver rectangle                                  |
| versace       | Green dial; champagne dial                                            |

Brand labels are taken from the folders and photographed markings; no model reference numbers or manufacturer specifications are inferred. Materials, movement and water resistance stay “À confirmer”. Prices (99–149 DT) and starting stock (10 per watch) are editable example amounts authorized by the owner, not confirmed inventory or valuations.

The owner's requested men's/women's labels are recorded in `data/watch-genders.json`: the three Snille designs and black Casio are labelled Homme, and the other fifteen designs Femme. These are editable visual-style guesses, not verified manufacturer designations. The storefront filters expose gender, brand, price and availability; category and movement remain internal product metadata.

## Files and prompts

- `public/images/products/<watch>/`: four optimized WebP photos and one original reference.
- `output/product-catalog/generated/`: generated PNG masters, preserved locally.
- `output/product-catalog/review/`: original contact sheets and four-image review strips.
- `output/product-catalog/review.html`: a local, searchable review gallery that opens without signing in.
- `output/product-catalog/generation-jobs.json`: exact prompt for each image, source path and destination.
- `output/product-catalog/source-inventory.json`: source file IDs and SHA-256 checksums.

Images are produced with the built-in image generation tool. Each image uses only the matching watch as reference. The prompt set requests: (1) ivory studio view, (2) neutral angled view, (3) dial macro, (4) limestone-and-linen editorial view. Every prompt locks the case, finish, dial, hands, indices, subdials, crown, bracelet and markings, and removes the hand/shop background. AI images can still alter fine lettering or small mechanical details; compare the retained originals before publishing.

## Import and review

```powershell
npm run catalog:images
npm run catalog:check
npm run catalog:import
```

The checker refuses missing files, duplicate identities, invalid values and incorrect image paths before it writes anything. The importer creates drafts, four ordered photos, a single photographed-model variant, and an audited opening stock movement in one transaction. Repeating the import skips existing SKUs and preserves edits and inventory. It does not replace demo products, delete anything, reseed users/orders or sync Google Sheets.

Open `/admin/products/photo-review` for the original and four finished photos side by side, with links to edit each watch. Open `/admin/products?show=hidden&q=HP-` to review the imported drafts. Deploy `public/images/products` with the application before making them visible in the admin. Then confirm the example commercial values and technical details. Existing drafts are intentionally not activated by re-running the importer.

For a fresh database whose image files are already deployed, `npm run catalog:import -- --publish` creates visible products directly.
