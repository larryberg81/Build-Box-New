import assert from "node:assert/strict";
import test from "node:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { parseSalesImport } from "./manage-sales.js";

const fixture = {
  sourceReference: "transaction-only-test",
  country: "US", productType: "container", productName: "Test container",
  city: "Test city", purchasedAt: new Date(Date.now() - 60_000).toISOString(),
  verified: true, displayApproved: true,
};

test("imports require real-purchase confirmation fields and safe public data", () => {
  assert.equal(parseSalesImport([fixture])[0].country, "US");
  for (const override of [
    { country: "GB" }, { productType: "inquiry" }, { verified: false },
    { purchasedAt: new Date(Date.now() + 86_400_000).toISOString() },
    { purchasedAt: "2026-01-01" }, { email: "private@example.com" },
    { imagePath: "https://tracker.example/photo.jpg" },
    { imagePath: "/images/../../private.jpg" },
  ]) assert.throws(() => parseSalesImport([{ ...fixture, ...override }]));
  assert.throws(() => parseSalesImport([fixture, fixture]));
  assert.throws(() => parseSalesImport([]));
});

test("feed isolates countries and excludes unapproved, unverified, stale and future records", async () => {
  const { pool, salesTable } = await import("../src/index.js");
  const { readSalesFeed } = await import("../../../artifacts/api-server/src/lib/sales-feed.js");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const database = drizzle(client);
    const now = Date.now();
    const rows = [
      { country: "US" as const, productType: "container" as const },
      { country: "CA" as const, productType: "genset" as const },
      { displayApproved: false }, { verified: false },
      { purchasedAt: new Date(now - 31 * 86_400_000) },
      { purchasedAt: new Date(now + 86_400_000) },
    ].map((overrides, index) => ({
      ...fixture, country: "US" as const, productType: "container" as const,
      purchasedAt: new Date(now - 60_000),
      sourceReference: `transaction-only-${now}-${index}`,
      ...overrides,
    }));
    const inserted = await database.insert(salesTable).values(rows).returning({ id: salesTable.id });
    const testIds = new Set(inserted.map(row => row.id));
    const us = (await readSalesFeed("US", database)).filter(row => testIds.has(row.id));
    const ca = (await readSalesFeed("CA", database)).filter(row => testIds.has(row.id));
    assert.deepEqual(us.map(row => row.id), [inserted[0].id]);
    assert.deepEqual(ca.map(row => row.id), [inserted[1].id]);
    assert.equal("sourceReference" in us[0], false);
    assert.equal("verified" in us[0], false);
  } finally {
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
  }
});
