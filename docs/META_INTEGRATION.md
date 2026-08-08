# Optional Meta integration

Hora does not require Meta and contains no Pixel ID or access token.

## Browser events

The typed abstraction supports:

- ViewContent
- Search
- AddToCart
- InitiateCheckout
- OrderPlaced

Set `NEXT_PUBLIC_META_PIXEL_ID` only after implementing the consent behavior appropriate to the business. Without it, the provider is a no-op while first-party events continue.

## Attribution

Middleware captures sanitized UTM parameters, campaign/ad/ad-set IDs, referrer and landing page in an httpOnly first-party cookie. Checkout persists optional values on the order. Admin order detail shows them.

## Conversions API

`sendMetaConversionApiEvent` is deliberately disabled even when credentials exist. Before enabling:

1. obtain valid consent and review Tunisian data/privacy requirements;
2. SHA-256 hash normalized identifiers;
3. reuse the browser event ID for deduplication;
4. add durable retries and failure monitoring;
5. document retention and deletion;
6. call Meta Graph API from the server only.

Use `META_PIXEL_ID` and `META_ACCESS_TOKEN`; never expose the access token to the browser.

## Product catalog

`/api/catalog/meta.csv` generates a catalog feed from Hora's database. If `META_CATALOG_FEED_TOKEN` is set, callers must provide it as `?token=` or a Bearer token. Configure Meta to fetch this URL only after deployment.
