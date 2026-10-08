import "dotenv/config";

if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
  console.log("Preview build: production checks skipped. Use a separate preview database and sheet.");
  process.exit(0);
}

const errors = [];
for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
  try {
    const value = process.env[name] ?? "";
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || /\[|\]|YOUR|PASSWORD|PROJECT/.test(value)) throw new Error();
    if (['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error();
    if (name === 'DIRECT_URL' && url.port === '6543') errors.push('DIRECT_URL must use direct or session mode (5432), not transaction mode (6543).');
  } catch { errors.push(`${name} must be a real PostgreSQL connection URL.`); }
}
const secret = process.env.SESSION_SECRET ?? "";
if (secret.length < 32 || /replace|change-me|ci-only|development/i.test(secret)) errors.push('SESSION_SECRET must be a unique random secret of at least 32 characters.');
try {
  const url = new URL(process.env.NEXT_PUBLIC_BASE_URL);
  if (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error();
} catch { errors.push('NEXT_PUBLIC_BASE_URL must be the public HTTPS store URL.'); }
if (!process.env.NEXT_PUBLIC_CONTACT_EMAIL && !process.env.NEXT_PUBLIC_CONTACT_PHONE) errors.push('Set a real business contact email or phone.');
for (const name of ['GOOGLE_SHEETS_SPREADSHEET_ID', 'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY']) {
  if (!process.env[name]) errors.push(`${name} is required for order exports.`);
}
if (!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.includes('BEGIN PRIVATE KEY')) errors.push('Google private key must be the service account PEM key.');
if ((process.env.CRON_SECRET ?? '').length < 32) errors.push('CRON_SECRET must be a random secret of at least 32 characters.');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Production environment checks passed (external connections still need verification).');
