import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") ?? "").split(",").filter((id) => UUID.test(id)).slice(0, 50);
  if (!ids.length) return NextResponse.json({ products: [] });
  const products = await db.product.findMany({
    where: { id: { in: ids }, active: true },
    select: {
      id: true, slugFr: true, slugEn: true, nameFr: true, nameEn: true, brand: true, averageRating: true,
      images: { take: 2, orderBy: { sortOrder: "asc" }, select: { url: true, altFr: true, altEn: true } },
      variants: { where: { active: true }, orderBy: { priceMillimes: "asc" }, select: { id: true, labelFr: true, labelEn: true, priceMillimes: true, compareAtPriceMillimes: true, stock: true } },
    },
  });
  return NextResponse.json({ products }, { headers: { "cache-control": "private, max-age=60" } });
}
