# Official HORA brand assets

The owner supplied `hora.jpeg` as the official logo and approved brand imagery. Its unchanged copy is retained at `public/images/brand/hora-original.jpeg`.

`node scripts/prepare-brand-assets.mjs` rebuilds the cropped and optimized assets from that copy. To replace the source with a new owner-provided file, pass its path as the first argument. The script crops the supplied artwork and removes background pixels for the navigation logos; it does not generate or redraw the emblem or lettering.

- Black emblem and wordmark: storefront header and mobile menu.
- Gold emblem and wordmark: footer and admin navigation.
- Full gold signature: homepage brand section, About page and admin login.
- Packaging, crown and dial crops: brand illustrations on the About page. These are brand visuals, not catalog product photographs.
- Social sharing image, browser icon and Apple touch icon: derived from the official gold signature.

The existing product-specific photo galleries remain mapped to their individual watches. See `WATCH_CATALOG.md` for their provenance.
