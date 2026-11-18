import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db, salesTable } from "@workspace/db";

export async function readSalesFeed(country: "US" | "CA", database: Pick<typeof db, "select"> = db) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sales = await database.select({
    id: salesTable.id,
    country: salesTable.country,
    productType: salesTable.productType,
    productName: salesTable.productName,
    city: salesTable.city,
    imagePath: salesTable.imagePath,
    purchasedAt: salesTable.purchasedAt,
  }).from(salesTable).where(and(
    eq(salesTable.country, country),
    eq(salesTable.verified, true),
    eq(salesTable.displayApproved, true),
    gte(salesTable.purchasedAt, cutoff),
    lte(salesTable.purchasedAt, now),
  )).orderBy(desc(salesTable.purchasedAt), desc(salesTable.id)).limit(20);
  return sales.map(sale => ({ ...sale, purchasedAt: sale.purchasedAt.toISOString() }));
}
