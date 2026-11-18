import assert from "node:assert/strict";
import { test } from "node:test";
import type { SaleNotification } from "@workspace/api-client-react";
import { formatPurchaseDate, isEligibleSale, isSalesPopupBlockedPath, resolvePublicImage, getNextSale, getSalesNotificationDelay, SALES_DISPLAY_MS } from "./sales-notifications";

const now = Date.parse("2026-11-18T12:00:00Z");
const sale: SaleNotification = {
  id: 1, country: "CA", productType: "genset", productName: "Generator",
  city: "Toronto", imagePath: null, purchasedAt: new Date(now - 60_000).toISOString(),
};
test("only matching, recent, valid sales can be shown", () => {
  assert.equal(isEligibleSale(sale, "CA", now), true);
  assert.equal(isEligibleSale(sale, "US", now), false);
  assert.equal(isEligibleSale({ ...sale, productType: "container" }, "CA", now), true);
  for (const override of [
    { id: -1 }, { city: "" }, { productName: "" }, { purchasedAt: "invalid" },
    { purchasedAt: new Date(now + 1).toISOString() },
    { purchasedAt: new Date(now - 31 * 86_400_000).toISOString() },
  ]) assert.equal(isEligibleSale({ ...sale, ...override }, "CA", now), false);
});
test("notification does not interrupt forms or private administration", () => {
  for (const path of ["/quote", "/quote/", "/quote?size=20", "/contact", "/admin/sales", "/sign-in", "/sign-up/verify-email-address"]) {
    assert.equal(isSalesPopupBlockedPath(path), true);
  }
  assert.equal(isSalesPopupBlockedPath("/gensets"), false);
  assert.equal(isSalesPopupBlockedPath("/"), false);
});
test("photos are local, base-path safe and cannot be tracking URLs", () => {
  assert.equal(resolvePublicImage("/images/container.webp", "/shipping/"), "/shipping/images/container.webp");
  for (const path of [null, "https://tracker.example/photo.jpg", "//tracker.example/photo.jpg", "/images/../secret.jpg"]) {
    assert.equal(resolvePublicImage(path, "/"), null);
  }
});
test("purchase date is the actual calendar date, not invented recency", () => {
  assert.match(formatPurchaseDate("2026-11-01T12:00:00Z", "US"), /2026/);
  assert.match(formatPurchaseDate("2026-11-01T12:00:00Z", "CA"), /2026/);
});

test("sales rotate continuously, wrapping after the last approved record", () => {
  const sales = [sale, { ...sale, id: 2 }, { ...sale, id: 3 }, { ...sale, id: 4 }];
  let lastId: number | undefined;
  const shown: number[] = [];
  for (let i = 0; i < 10; i++) {
    const next = getNextSale(sales, "CA", lastId, now);
    assert.ok(next);
    shown.push(next.id);
    lastId = next.id;
  }
  assert.deepEqual(shown, [1, 2, 3, 4, 1, 2, 3, 4, 1, 2]);
  assert.equal(getNextSale([sale], "CA", sale.id, now)?.id, sale.id);
  assert.equal(getNextSale(sales, "US", undefined, now), null);
  assert.equal(getNextSale([], "CA", undefined, now), null);
  assert.equal(getNextSale([sale], "CA", undefined, now + 31 * 86400000), null);
  assert.equal(getNextSale(sales, "CA", 999, now)?.id, sale.id);
});

test("the next popup starts 30 seconds after the previous one started, not 37", () => {
  assert.equal(getSalesNotificationDelay(null, now), 8000);
  assert.equal(getSalesNotificationDelay(now, now + SALES_DISPLAY_MS), 23000);
  assert.equal(getSalesNotificationDelay(now, now + 30000), 0);
  assert.equal(getSalesNotificationDelay(now, now + 60000), 0);
});
