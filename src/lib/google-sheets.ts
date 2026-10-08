import { importPKCS8, SignJWT } from "jose";
import { db } from "@/lib/db";
import { orderSheetRange } from "@/lib/order-sheet-row";

let cachedToken: { value: string; expiresAt: number } | undefined;

export function sheetsConfigured() {
  return Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
}

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const key = await importPKCS8(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replaceAll("\\n", "\n"), "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/spreadsheets" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt().setExpirationTime("1h").sign(key);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(8_000), cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google authentication HTTP ${response.status}`);
  const data = await response.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Google authentication returned no token");
  cachedToken = { value: data.access_token, expiresAt: Date.now() + Math.max(0, (data.expires_in ?? 3600) - 60) * 1000 };
  return cachedToken.value;
}

export async function syncOrderSheets(orderId?: string) {
  if (!sheetsConfigured()) return { configured: false, synced: 0, failed: 0 };
  const exports = await db.orderSheetExport.findMany({
    where: { syncedAt: null, ...(orderId ? { orderId } : {}), nextAttemptAt: { lte: new Date() } },
    orderBy: { id: "asc" }, take: orderId ? 1 : 20,
  });
  let synced = 0;
  let failed = 0;
  // Batch stays inside the function's time budget even during a Google outage.
  const deadline = Date.now() + 25_000;
  for (const job of exports) {
    if (Date.now() > deadline) break;
    try {
      const range = orderSheetRange(process.env.GOOGLE_SHEETS_TAB_NAME ?? "Orders", job.id);
      const spreadsheet = encodeURIComponent(process.env.GOOGLE_SHEETS_SPREADSHEET_ID!);
      const token = await accessToken();
      // Grow only by appending rows; concurrent workers cannot shrink the grid.
      const metadata = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet}?fields=sheets(properties(sheetId,title,gridProperties(rowCount)))`, {
        headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8_000), cache: "no-store",
      });
      if (!metadata.ok) throw new Error(`Google Sheets HTTP ${metadata.status}`);
      const info = await metadata.json() as { sheets?: { properties: { sheetId: number; title: string; gridProperties: { rowCount: number } } }[] };
      const tab = info.sheets?.find((sheet) => sheet.properties.title === (process.env.GOOGLE_SHEETS_TAB_NAME ?? "Orders"));
      if (!tab) throw new Error("Orders tab missing");
      if (tab.properties.gridProperties.rowCount < job.id + 1) {
        const grow = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet}:batchUpdate`, {
          method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify({ requests: [{ appendDimension: { sheetId: tab.properties.sheetId, dimension: "ROWS", length: Math.max(1000, job.id + 1 - tab.properties.gridProperties.rowCount) } }] }),
          signal: AbortSignal.timeout(8_000), cache: "no-store",
        });
        if (!grow.ok) throw new Error(`Google Sheets HTTP ${grow.status}`);
      }
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
        method: "PUT",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ range, majorDimension: "ROWS", values: [job.values] }),
        signal: AbortSignal.timeout(8_000), cache: "no-store",
      });
      if (!response.ok) throw new Error(`Google Sheets HTTP ${response.status}`);
      await db.orderSheetExport.update({ where: { id: job.id }, data: { syncedAt: new Date(), lastError: null, attempts: { increment: 1 } } });
      synced += 1;
    } catch (error) {
      // Store only a safe error category, never credentials or customer data.
      const message = error instanceof Error && /^Google (authentication|Sheets) HTTP \d+$/.test(error.message)
        ? error.message : "Google Sheets export failed";
      await db.orderSheetExport.updateMany({ where: { id: job.id, syncedAt: null }, data: {
        attempts: { increment: 1 }, lastError: message,
        nextAttemptAt: new Date(Date.now() + Math.min(3_600_000, 60_000 * 2 ** Math.min(job.attempts, 6))),
      } });
      console.error("Order sheet export failed", { exportId: job.id, error: message });
      failed += 1;
    }
  }
  return { configured: true, synced, failed };
}
