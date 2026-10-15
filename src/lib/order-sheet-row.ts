import type { Order, OrderItem } from "@prisma/client";

export const ORDER_SHEET_HEADERS = [
  "Order ID", "Order number", "Placed at (UTC)", "First name", "Last name",
  "Phone", "Email", "Governorate", "City", "Postal code", "Address",
  "Address line 2", "Delivery instructions", "Customer notes", "Products",
  "Subtotal (TND)", "Delivery (TND)", "Total (TND)", "Source", "Campaign",
  "Status", "Payment", "Last updated (UTC)",
];

function columnLetter(count: number) {
  let letters = "";
  for (let index = count; index > 0; index = Math.floor((index - 1) / 26)) {
    letters = String.fromCharCode(65 + ((index - 1) % 26)) + letters;
  }
  return letters;
}

const LAST_COLUMN = columnLetter(ORDER_SHEET_HEADERS.length);

export function orderSheetRow(order: Order & { items: OrderItem[] }): (string | number)[] {
  return [
    order.id, order.orderNumber, order.createdAt.toISOString(),
    order.customerFirstName, order.customerLastName, order.phone,
    order.customerEmail ?? "", order.governorate, order.city, order.postalCode,
    order.addressLine1, order.addressLine2 ?? "", order.deliveryInstructions ?? "",
    order.customerNotes ?? "",
    order.items.map((item) => `${item.sku}: ${item.productNameFr} (${item.variantLabelFr}) x${item.quantity}`).join("; "),
    order.subtotalMillimes / 1000, order.deliveryFeeMillimes / 1000,
    order.totalMillimes / 1000, order.source ?? "", order.campaign ?? "",
    order.status ?? "PENDING", order.paymentStatus ?? "UNPAID",
    (order.updatedAt ?? order.createdAt).toISOString(),
  ];
}

export function orderSheetRange(tab: string, exportId: number) {
  if (!Number.isSafeInteger(exportId) || exportId < 1) throw new Error("Invalid export ID");
  return `${quotedTab(tab)}!A${exportId + 1}:${LAST_COLUMN}${exportId + 1}`;
}

export function orderSheetHeaderRange(tab: string) {
  return `${quotedTab(tab)}!A1:${LAST_COLUMN}1`;
}

export function quotedTab(tab: string) {
  return `'${tab.replaceAll("'", "''")}'`;
}
