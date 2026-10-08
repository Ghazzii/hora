import "dotenv/config";
import { db } from "../src/lib/db";
import { orderSheetRow } from "../src/lib/order-sheet-row";

async function main() {
  let cursor: string | undefined;
  let count = 0;
  for (;;) {
    const orders = await db.order.findMany({
      include: { items: true }, orderBy: { id: "asc" }, take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (!orders.length) break;
    for (const order of orders) {
      await db.orderSheetExport.upsert({ where: { orderId: order.id },
        create: { orderId: order.id, values: orderSheetRow(order) }, update: {},
      });
      count += 1;
    }
    cursor = orders.at(-1)!.id;
  }
  console.log(`Checked ${count} orders; exports are queued for the next cron run.`);
}

main().catch(() => { console.error("Backfill failed; check the database connection and migrations."); process.exitCode = 1; })
  .finally(() => db.$disconnect());
