import { and, desc, eq } from "drizzle-orm";
import { db, insertSaleSchema, salesTable } from "@workspace/db";

type SaleRow = typeof salesTable.$inferSelect;
export function serializeAdminSale(sale: SaleRow) {
  return {
    ...sale, purchasedAt: sale.purchasedAt.toISOString(),
    createdAt: sale.createdAt.toISOString(),
  };
}

export async function listSales() {
  return (await db.select().from(salesTable)
    .orderBy(desc(salesTable.createdAt), desc(salesTable.id)).limit(500)).map(serializeAdminSale);
}

function databaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  return "cause" in error ? databaseErrorCode(error.cause) : undefined;
}

export async function saveSale(input: unknown, id?: number) {
  const parsed = insertSaleSchema.strict().safeParse(input);
  if (!parsed.success || parsed.data.verified !== true || parsed.data.displayApproved === undefined) {
    return { status: 400, body: { error: "Use a valid purchase date, completed-sale verification and local product image path." } };
  }
  try {
    const rows = id === undefined
      ? await db.insert(salesTable).values(parsed.data).returning()
      : await db.update(salesTable).set(parsed.data).where(eq(salesTable.id, id)).returning();
    if (!rows[0]) return { status: 404, body: { error: "Sale not found." } };
    return { status: id === undefined ? 201 : 200, body: serializeAdminSale(rows[0]) };
  } catch (error) {
    if (databaseErrorCode(error) === "23505") {
      return { status: 409, body: { error: "This order reference is already recorded. Edit the existing sale instead." } };
    }
    throw error;
  }
}

export async function setSaleVisibility(id: number, displayApproved: boolean) {
  // Verification is checked atomically with an approval write.
  const rows = await db.update(salesTable).set({ displayApproved }).where(and(
    eq(salesTable.id, id),
    ...(displayApproved ? [eq(salesTable.verified, true)] : []),
  )).returning();
  if (rows[0]) return { status: 200, body: serializeAdminSale(rows[0]) };
  const existing = await db.select({ id: salesTable.id }).from(salesTable)
    .where(eq(salesTable.id, id)).limit(1);
  return existing.length
    ? { status: 409, body: { error: "Verify this completed sale before approving it for display." } }
    : { status: 404, body: { error: "Sale not found." } };
}
