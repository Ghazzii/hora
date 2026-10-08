import type { Order, OrderItem } from "@prisma/client";

export const ORDER_SHEET_HEADERS = [
  "Order ID", "Order number", "Placed at (UTC)", "First name", "Last name",
  "Phone", "Email", "Governorate", "City", "Postal code", "Address",
  "Address line 2", "Delivery instructions", "Customer notes", "Products",
  "Subtotal (TND)", "Delivery (TND)", "Total (TND)", "Source", "Campaign",
];

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
  ];
}

export function orderSheetRange(tab: string, exportId: number) {
  if (!Number.isSafeInteger(exportId) || exportId < 1) throw new Error("Invalid export ID");
  return `'${tab.replaceAll("'", "''")}'!A${exportId + 1}:T${exportId + 1}`;
}
