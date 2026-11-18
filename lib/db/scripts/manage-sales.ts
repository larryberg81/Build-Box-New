import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { insertSaleSchema } from "../src/schema/sales.js";

const approvedSale = insertSaleSchema.extend({
  verified: z.literal(true),
  displayApproved: z.boolean(),
}).strict();

export function parseSalesImport(input: unknown) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 500) {
    throw new Error("Provide a JSON array of 1–500 genuinely completed sales.");
  }
  const sales = input.map(row => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error("Each sale must be an object.");
    }
    const record = row as Record<string, unknown>;
    if (typeof record.purchasedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(record.purchasedAt)) {
      throw new Error("purchasedAt must be an ISO timestamp including its timezone.");
    }
    return approvedSale.parse({ ...record, purchasedAt: new Date(record.purchasedAt) });
  });
  if (new Set(sales.map(sale => sale.sourceReference)).size !== sales.length) {
    throw new Error("Duplicate sourceReference values in the import.");
  }
  return sales;
}

async function main() {
  const [command, value, confirmation] = process.argv.slice(2);
  if (command !== "import" && command !== "hide" && command !== "list") {
    throw new Error("Usage: sales list | sales hide ID | sales import /absolute/path/sales.json --confirm-completed-sales");
  }
  const sales = command === "import"
    ? (confirmation === "--confirm-completed-sales" && value
      ? parseSalesImport(JSON.parse(await readFile(value, "utf8")))
      : (() => { throw new Error("Import requires a file and --confirm-completed-sales."); })())
    : [];
  const id = command === "hide" ? z.coerce.number().int().positive().parse(value) : undefined;
  // Load credentials only after validating all input. Never print connection details.
  const { db, pool, salesTable } = await import("../src/index.js");
  try {
    if (command === "list") {
      const rows = await db.select({
        id: salesTable.id, country: salesTable.country,
        productName: salesTable.productName, purchasedAt: salesTable.purchasedAt,
        displayApproved: salesTable.displayApproved,
      }).from(salesTable).limit(100);
      process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    } else if (command === "hide" && id !== undefined) {
      const rows = await db.update(salesTable).set({ displayApproved: false })
        .where(eq(salesTable.id, id)).returning({ id: salesTable.id });
      if (!rows.length) throw new Error("Sale not found.");
      process.stdout.write(`Withdrew sale ${id} from public notifications.\n`);
    } else {
      await db.transaction(async transaction => {
        for (const sale of sales) {
          await transaction.insert(salesTable).values(sale)
            .onConflictDoUpdate({ target: salesTable.sourceReference, set: sale });
        }
      });
      process.stdout.write(`Saved ${sales.length} completed sales. Only approved recent records can appear publicly.\n`);
    }
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    // Do not log raw database errors or imported records.
    process.stderr.write("Sales command failed. Check the arguments, validated JSON fields, database configuration and sales table. No partial imports are committed.\n");
    process.exitCode = 1;
  });
}
