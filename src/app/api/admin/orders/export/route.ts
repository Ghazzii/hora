import { NextResponse } from "next/server";
import { canAccessAdmin, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { orderWhere } from "@/lib/admin-orders";
import { tunisDay } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** Quotes a CSV cell and neutralises spreadsheet formulas in free text. */
function cell(value: string | number | null | undefined, { trusted = false } = {}) {
  let text = value === null || value === undefined ? "" : String(value);
  if (!trusted && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  if (!canAccessAdmin(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const where = orderWhere({
    q: params.get("q") ?? undefined,
    status: params.get("status") ?? undefined,
    source: params.get("source") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  });
  const orders = await db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 5000, include: { items: true } });
  const header = ["Order number", "Placed (Tunis)", "Status", "Payment", "First name", "Last name", "Phone", "Email", "Governorate", "City", "Postal code", "Address", "Address line 2", "Delivery instructions", "Products", "Units", "Subtotal (TND)", "Delivery (TND)", "Total (TND)", "Source", "Campaign", "Admin notes"];
  const rows = orders.map((order) => [
    cell(order.orderNumber, { trusted: true }),
    cell(`${tunisDay(order.createdAt)} ${new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Tunis", hour: "2-digit", minute: "2-digit" }).format(order.createdAt)}`, { trusted: true }),
    cell(order.status, { trusted: true }),
    cell(order.paymentStatus, { trusted: true }),
    cell(order.customerFirstName),
    cell(order.customerLastName),
    // Phones are validated and normalised server-side, so the leading "+" is safe.
    cell(order.phone, { trusted: true }),
    cell(order.customerEmail),
    cell(order.governorate, { trusted: true }),
    cell(order.city),
    cell(order.postalCode),
    cell(order.addressLine1),
    cell(order.addressLine2),
    cell(order.deliveryInstructions),
    cell(order.items.map((item) => `${item.productNameFr} (${item.variantLabelFr}) x${item.quantity}`).join(" | ")),
    cell(order.items.reduce((sum, item) => sum + item.quantity, 0), { trusted: true }),
    cell((order.subtotalMillimes / 1000).toFixed(3), { trusted: true }),
    cell((order.deliveryFeeMillimes / 1000).toFixed(3), { trusted: true }),
    cell((order.totalMillimes / 1000).toFixed(3), { trusted: true }),
    cell(order.source ?? "direct"),
    cell(order.campaign),
    cell(order.adminNotes),
  ].join(";"));
  // UTF-8 BOM and semicolons open cleanly in French-locale Excel as well as Google Sheets.
  const body = `﻿${header.map((name) => cell(name, { trusted: true })).join(";")}\r\n${rows.join("\r\n")}\r\n`;
  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="hora-orders-${tunisDay(new Date())}.csv"`,
      "cache-control": "no-store",
    },
  });
}
