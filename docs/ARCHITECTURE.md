# Architecture

Hora is a portable Next.js modular monolith. The browser, server routes and administrative application share one TypeScript codebase while business rules and database access remain separate from UI.

## Boundaries

- `src/app`: routing and request/response composition.
- `src/components`: presentation and client interaction.
- `src/lib/products.ts`: catalog reads.
- `src/lib/orders.ts`: transactional order creation and lifecycle.
- `src/lib/auth.ts`: database sessions and role checks.
- `src/features/admin/actions.ts`: authenticated admin mutations.
- `src/lib/analytics`: typed provider boundary for first-party/Meta events.
- Prisma is the portability boundary for PostgreSQL. Important rules are ordinary TypeScript, not Supabase functions.

## Data ownership

PostgreSQL is authoritative for users, products, variants, inventory, reviews, orders and analytics. Cart/wishlist guest state is local convenience only. Checkout never trusts local prices or stock.

Order items snapshot names, slugs, SKUs, variant labels, images and prices so historical orders survive later catalog changes.

## Authentication

A random 256-bit session token is stored only in an httpOnly cookie. PostgreSQL stores its SHA-256 hash and expiry. Passwords use bcrypt cost 12. Admin pages and every server action independently enforce the ADMIN role.

## Money

All persisted and calculated values use integer millimes. `329000` means `329.000 DT`. The delivery constant is `8000`.

## Scale seams

Replace the in-memory rate limiter with Redis-compatible storage for multiple instances. Product images can move from local assets to object storage by changing URLs and approved Next.js image hosts. Email/SMS, fulfillment and Meta CAPI belong behind adapters, not inside checkout.
