# Hora

Hora is an independent, bilingual (French/English) watch ecommerce application for Tunisia. It owns its catalog, inventory, customers, reviews, attribution and cash-on-delivery orders in Supabase PostgreSQL.

This repository contains the complete source code. It does **not** use Shopify or a payment gateway, and it contains no deployment or domain configuration.

## Stack

- Next.js App Router, React and strict TypeScript
- Tailwind CSS with accessible shadcn/ui-style primitives
- Supabase PostgreSQL and Prisma ORM
- Database-backed signed-session authentication with bcrypt password hashes
- Zod validation, Vitest and Playwright
- GitHub Actions for verification only (no deployment)

## Requirements

- Node.js 20.9+ (Node 22 recommended)
- npm 10+
- A free Supabase project (no Docker or local database installation)

## Local setup

### macOS / Linux

```bash
git clone https://github.com/Ghazzii/hora.git
cd hora
npm install
cp .env.example .env
 # Add your Supabase pooled and direct connection strings to .env
npm run db:setup
npm run dev
```

### Windows PowerShell

```powershell
git clone https://github.com/Ghazzii/hora.git
cd hora
npm install
Copy-Item .env.example .env
# Add your Supabase pooled and direct connection strings to .env
npm run db:setup
npm run dev
```

Open http://localhost:3000. The root redirects to French at `/fr`; English is at `/en`.

## Development credentials

Seed-only accounts:

- Admin: `admin@hora.tn` / `HoraAdmin123!`
- Customer: `client@hora.tn` / `HoraClient123!`

The admin account is marked as requiring a password change. These values are for local development only. Replace them before using real customer data.

## Core flows

1. Customers browse/filter products and select a stocked variant.
2. The guest cart is stored locally; displayed client prices are informational.
3. Checkout validates Tunisian contact/address details and COD consent.
4. The server reloads products and prices, atomically checks/decrements stock, creates immutable order-item snapshots and records inventory movements.
5. Hora stores the order in its own Supabase database and returns a non-guessable confirmation token.
6. Admin staff call the customer, then move the order through Pending → Confirmed → Preparing → Shipped → Delivered.
7. Delivery marks COD paid. Cancellation and delivered returns restock once and create audit movements.

Delivery is fixed at **8 DT (8,000 millimes)**. Money is stored as integer millimes; no floating-point prices are persisted.

## Main routes

- `/fr`, `/en` — localized storefront
- `/[locale]/montres` — catalog, search, filters, sort and pagination
- `/[locale]/montres/[slug]` — product, variants, stock and reviews
- `/[locale]/panier`, `/[locale]/commande` — cart and COD checkout
- `/[locale]/favoris` — persistent guest wishlist
- `/[locale]/compte` — optional account and order history
- `/admin/login`, `/admin` — protected administration
- `/api/health` — database health
- `/api/catalog/meta.csv` — optional Meta-compatible catalog feed

## Useful commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local development |
| `npm run build` | Prisma generation and production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Strict TypeScript check |
| `npm test` | Unit tests |
| `npm run test:e2e` | Playwright smoke tests |
| `npm run db:setup` | Apply the Supabase schema and add demo data |
| `npm run db:migrate` | Apply the current database schema |
| `npm run db:seed` | Idempotent demo seed |
| `npm run db:reset` | Reset local DB (destructive) |
| `npm run db:studio` | Prisma data browser |

## Environment

Copy `.env.example`. Required:

- `DATABASE_URL`
- `SESSION_SECRET` (unique, at least 32 characters)
- `NEXT_PUBLIC_BASE_URL`

Optional Meta variables are empty by default. Their absence never breaks the application. See [docs/META_INTEGRATION.md](docs/META_INTEGRATION.md).

## Supabase setup

1. Create a free Supabase project.
2. In **Connect**, copy the pooled connection string into `DATABASE_URL` and the direct connection string into `DIRECT_URL`. These are server secrets: never add them to `NEXT_PUBLIC_*` variables or commit `.env`.
3. Run `npm run db:setup` once to create the tables and demo data.
4. Deploy the UI and add the same `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, and `NEXT_PUBLIC_BASE_URL` values as encrypted host environment variables.

The Supabase free plan is appropriate for the early store, but it can pause after inactivity and does not include automatic backups. Export the database regularly and upgrade once real order volume requires stronger uptime guarantees.

## Project structure

```text
prisma/
  migrations/       Portable SQL migration
  schema.prisma     Normalized database schema
  seed.ts           Demo users, products, reviews and orders
public/images/      Local demo watch artwork
src/
  app/               Storefront, admin and API routes
  components/        Shared, storefront, checkout and admin UI
  features/admin/    Authorized admin mutations
  lib/               Auth, DB, validation, orders and analytics
  providers/         Persistent cart and wishlist state
  types/             Shared UI types
docs/                Architecture, workflow, Meta and deployment notes
e2e/                 Route smoke tests
```

## Security and production readiness

The application uses httpOnly same-site session cookies, bcrypt password hashes, server-side authorization, Zod validation, safe order lookup tokens, security headers and an in-memory development rate limiter. Before production:

- use a managed/shared rate limiter;
- rotate seed credentials and `SESSION_SECRET`;
- configure backups, TLS and monitoring;
- review Tunisian privacy, consumer, returns and invoicing obligations;
- complete legal/contact starter copy;
- restrict approved image hosts if remote images are enabled.

## Deploying later

Production deployment is intentionally out of scope. When ready, choose a Node.js-compatible host, configure the documented Supabase and app environment variables, run `npm run db:migrate`, then `npm run build && npm start`. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). No deployment has been performed by this project.
