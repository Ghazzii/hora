# Launch Hora on Vercel, Supabase and Google Sheets

Hora uses Next.js and cash on delivery. Supabase PostgreSQL stores the catalog, orders, inventory and accounts. Prisma handles database access and Hora's existing authentication remains in use; Supabase Auth and public API keys are not needed.

Each accepted checkout queues a Google Sheets export in the same transaction as the order and stock update. A background task writes it after checkout; an authenticated Vercel cron retries pending exports daily at 06:00 UTC (07:00 in Tunis), with manual retry available from the admin. After upgrading to Pro, change the schedule in `vercel.json` to `*/10 * * * *` for ten-minute retries. Each order gets a stable spreadsheet row, so a retry overwrites that row instead of adding a duplicate. Both guests and signed-in customers are included. Repeat customers have one row per order; logging an order does not create a login account.

## 1. Create Supabase

1. Sign up at https://supabase.com/dashboard and create a project named `hora` in a region near your users and Vercel deployment. Save its database password privately.
2. In **Connect**, copy **Transaction pooler**, port **6543**, for `DATABASE_URL`. For Prisma 6 add `pgbouncer=true&connection_limit=1&pool_timeout=20&sslmode=require` to its query string. Use `?` before the first parameter and `&` between subsequent parameters.
3. Copy **Session pooler**, port **5432**, for `DIRECT_URL`, with `sslmode=require`. This supports IPv4 on Windows and migration runners. The direct host is also usable when your network supports IPv6. URL-encode special characters in the database password.
4. In Supabase API settings disable the Data API because Hora uses Prisma exclusively. Migrations also enable RLS without browser-access policies on every application table. Connect as `postgres` or a configured Prisma role with RLS bypass and appropriate privileges.

Official reference: https://supabase.com/docs/guides/database/prisma

## 2. Apply the database schema

Put your real `DATABASE_URL` and `DIRECT_URL` into local `.env`, preserving any previous settings privately. Do not commit secrets or paste them into chat. For a **new empty** database:

```powershell
npm ci
npm run db:generate
npm run db:migrate
```

Do not use `db:setup`, `db:seed` or `db:reset` against the live store. The seed contains demonstration products, accounts, reviews and orders. Production environments reject demo seeding, but local commands still require you to select the correct database.

If an **existing PostgreSQL** database was created with `db push`, back it up and compare its schema to `20260807000000_init`. Only if it matches, baseline it before deploying:

```powershell
node scripts/prisma.mjs migrate resolve --applied 20260807000000_init
npm run db:migrate
npm run db:sheets:backfill
```

The historical `20260807000000_init` migration has been restored unchanged from Git history. A database already carrying this applied migration only needs `npm run db:migrate` for the new integration tables; do not baseline it again. Never baseline a database with a different schema. Local SQLite `.db` files are not used by production and are not automatically imported; data you want to preserve needs a separate import.

## 3. Create the production admin and catalog

In your private local `.env`, set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` with at least 16 characters. Run:

```powershell
npm run db:admin
```

The command refuses to overwrite existing users, creates no demo data, and disables the known seed-only `admin@hora.tn` and `client@hora.tn` accounts when they differ from the new admin. Do not deploy `ADMIN_PASSWORD` or development seed credentials to Vercel. Run `npm run dev`, sign in at `/admin/login`, and add real products, variants, images and stock through `/admin`. Products can be hidden from the store or deleted permanently from their edit page; deleting keeps past orders intact because each order line stores its own name, SKU, price and photo.

To upload product photos directly from the admin (instead of pasting URLs), add `SUPABASE_SERVICE_ROLE_KEY` as a server-only variable locally and in Vercel, then redeploy. Use **Project Settings → API Keys → Secret key** (`sb_secret_…`) or the legacy `service_role` key. The project URL is derived from `DATABASE_URL`; set `SUPABASE_URL` only to override it. Hora creates a public `product-images` bucket on the first upload, resizes large photos to WebP in the browser, and allows the Supabase host for `next/image` automatically. Without these variables the admin still accepts image URLs from hosts listed in `PRODUCT_IMAGE_HOST`.

Admin setup also creates a default Montres / Watches category so the empty store can accept new products. Add further real categories through the Supabase Table Editor if needed. Avoid demo accounts with publicly documented passwords. For remote product images, set `PRODUCT_IMAGE_HOST` to the exact HTTPS hostname (for example your Supabase storage host), then rebuild.

## 4. Set up Google Sheets

1. Create a private spreadsheet at https://sheets.google.com named `Hora Orders`. Rename its first tab **Orders**.
2. Copy its spreadsheet ID: the text between `/d/` and `/edit` in its URL.
3. At https://console.cloud.google.com create a project named `hora-orders`.
4. Open **APIs & Services → Library** and enable **Google Sheets API**.
5. Open **IAM & Admin → Service Accounts → Create service account**, named `hora-orders`. It does not need a project-wide Editor role.
6. Open that account, then **Keys → Add key → Create new key → JSON**. Save this credential privately outside the repository.
7. Share the spreadsheet with the JSON's `client_email`, granting **Editor** access. Keep general access restricted.
8. Set these server-only variables locally and in Vercel's **Production** environment:

```dotenv
GOOGLE_SHEETS_SPREADSHEET_ID="YOUR_SPREADSHEET_ID"
GOOGLE_SHEETS_TAB_NAME="Orders"
GOOGLE_SHEETS_PRODUCTS_TAB_NAME="Products"
GOOGLE_SERVICE_ACCOUNT_EMAIL="CLIENT_EMAIL_FROM_JSON"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="PRIVATE_KEY_FROM_JSON"
CRON_SECRET="SECOND_UNIQUE_RANDOM_SECRET"
```

Use the complete `private_key` PEM including BEGIN/END lines. Real line breaks and literal `\n` escapes are supported. Never use `NEXT_PUBLIC_` for these secrets.

Hora writes the header row (**A1:W1**) itself on every sync, so you don't need to type it. The 23 columns are:

```text
Order ID	Order number	Placed at (UTC)	First name	Last name	Phone	Email	Governorate	City	Postal code	Address	Address line 2	Delivery instructions	Customer notes	Products	Subtotal (TND)	Delivery (TND)	Total (TND)	Source	Campaign	Status	Payment	Last updated (UTC)
```

The Orders tab is reserved for application writes. **Do not physically sort, delete or insert rows.** Use filter views or a separate reporting tab. Stable positions make retries safe; gaps from rolled-back database sequences are normal. The integration grows the grid as needed. RAW values preserve phones/postal codes as text and prevent customer input from becoming formulas. Monetary totals are numeric TND.

Each order keeps one stable row. When an admin changes an order's status or COD payment, the same transaction re-queues that row, so **Status**, **Payment** and **Last updated** stay current (written immediately in the background, or by the cron retry). The admin dashboard's **Google Sheets** card shows pending/failing rows and offers **Sync now** and **Refresh all rows** (rewrites every order with its current status, e.g. once after upgrading from the 20-column layout). Keep the destination fixed: changing spreadsheet/tab requires explicitly re-exporting previously synced jobs. Deleting a sheet row does not automatically recreate it. Include both Supabase and Sheets in retention/deletion processes.

### Manage the catalog from a Products tab (optional)

The same spreadsheet can drive the catalog. In the admin, **Products → Sync products now** reads a **Products** tab (override with `GOOGLE_SHEETS_PRODUCTS_TAB_NAME`). The first click creates the tab with its header row; fill it in and sync again. Nothing changes on the site until someone presses the button.

- **One row per option (SKU).** Rows sharing a **Product code** form one watch, and the watch's names, category, photos and details come from its first row, so later rows only need **SKU**, **Variant FR/EN** and **Price (TND)**. A blank **SKU** uses the product code.
- **Required:** Product code, Name FR, Category (an existing category name or slug, e.g. `Sport`) and Price (TND). Everything else is optional: blank details keep their current value, or get the same defaults as the admin form for new watches. A blank **Compare at price** removes a promotion. **Images** takes https links on an allowed host or `/images/…` paths, separated by spaces, commas or line breaks; blank keeps the current photos.
- **Existing products** are taken over when their SKU (e.g. `HORA-ATLAS`) is used as a product code. Their URL slug never changes. Products never listed in the sheet are left alone.
- **Deleting a row hides** that option, or the whole watch when all its rows are gone. Nothing is deleted, so past orders and reviews stay intact, and adding the row back shows it again. **Active** = `no` hides an option without deleting the row.
- **Stock is not in the sheet.** New options start at 0. Use **Inventory** to receive stock; orders keep adjusting it as usual.
- Rows with mistakes are skipped and listed on the Products page with their row number; everything else still syncs. A row with a mistake is never hidden.
- Once a watch comes from the sheet, its edit page says so: change names and prices in the sheet, because the next sync replaces edits made in the admin.

Official references: https://developers.google.com/identity/protocols/oauth2/service-account and https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/update

## 5. Configure Vercel

1. Create an account at https://vercel.com/signup and connect the GitHub account owning `Ghazzii/hora`.
2. Commit and push the prepared changes to your intended production branch.
3. Select **Add New → Project → Import Git Repository → hora**. Keep **Next.js** and the repository root. Select **Node.js 22.x**. `vercel.json` configures `npm run build:vercel`.
4. Add the Supabase and Sheets variables above to **Production**, plus:

```dotenv
SESSION_SECRET="FIRST_UNIQUE_RANDOM_SECRET"
NEXT_PUBLIC_BASE_URL="https://YOUR_PROJECT.vercel.app"
NEXT_PUBLIC_CONTACT_EMAIL="YOUR_REAL_BUSINESS_EMAIL"
NEXT_PUBLIC_CONTACT_PHONE="YOUR_REAL_BUSINESS_PHONE"
```

Generate each independent secret using this command and save it privately:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

5. Use **Vercel Pro** for the commercial store and ten-minute cron. The checked-in configuration uses a daily retry compatible with the existing Hobby account; Hobby is for personal, non-commercial use and supports cron only once daily. Upgrade before a commercial launch, then set the retry schedule to `*/10 * * * *`.
6. Deploy. If the assigned production URL differs from `NEXT_PUBLIC_BASE_URL`, correct the variable and redeploy. Add your custom domain when available and update the same variable.

Production builds check configuration, generate Prisma Client and build Next.js. **Builds do not migrate or seed the database.** Run `npm run db:migrate` deliberately before deploying schema additions. Preview deployments need separate databases, Sheets and secrets; do not give them access to production customer data.

Official references: https://vercel.com/docs/frameworks/full-stack/nextjs, https://vercel.com/docs/cron-jobs, https://vercel.com/pricing

## 6. Validate the launch

```powershell
npm run production:check
npm run lint
npm run typecheck
npm test
npm run build
```

- Deployed `/api/health` must return HTTP 200 and `database: connected`.
- Sign in with the new administrator, check catalog/stock, and publish your seller identity, real business contact, returns and privacy terms. The legal pages still contain starter notices; complete them with your actual policies.
- Place a controlled order. Check `/admin/orders`, exactly one stock decrement, and one private Sheet row. Retry with the original idempotency key and confirm there is still only one order/row.
- Trigger `/api/cron/order-sheets` from Vercel **Settings → Cron Jobs**. Inspect `synced`, `failed` and `pending` counts. Supabase's `OrderSheetExport` shows safe error categories, attempts and next retry times.
- Test cancellation/restocking, customer order links, and protected admin routes over HTTPS.
- Configure uptime/error monitoring and database backups. Size the Supabase plan for uptime/backup needs. The cron handles up to 20 exports per run within its time budget; increase capacity if outage recovery or volume requires it.

Launch remains incomplete until the real Supabase connection, Google integration and deployed checkout are verified.
