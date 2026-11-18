import type { SaleNotification } from "@workspace/api-client-react";

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const SALES_LOOP_INTERVAL_MS = 30_000;
export const SALES_DISPLAY_MS = 7_000;
const FIRST_DELAY_MS = 8_000;

export function getSalesNotificationDelay(lastShownAt: number | null, now: number): number {
  return lastShownAt === null ? FIRST_DELAY_MS : Math.max(0, lastShownAt + SALES_LOOP_INTERVAL_MS - now);
}

export function getNextSale(
  sales: SaleNotification[], market: "US" | "CA", lastId: number | undefined, now: number,
): SaleNotification | null {
  const eligible = sales.filter(sale => isEligibleSale(sale, market, now));
  if (!eligible.length) return null;
  const index = eligible.findIndex(sale => sale.id === lastId);
  return eligible[(index + 1) % eligible.length];
}

export function isEligibleSale(sale: SaleNotification, market: "US" | "CA", now: number): boolean {
  if (!sale || sale.country !== market || !Number.isInteger(sale.id) || sale.id < 1) return false;
  if (!["container", "genset"].includes(sale.productType)) return false;
  if (!sale.productName?.trim() || !sale.city?.trim()) return false;
  const purchasedAt = Date.parse(sale.purchasedAt);
  return Number.isFinite(purchasedAt) && purchasedAt <= now && now - purchasedAt <= MAX_AGE_MS;
}

export function isSalesPopupBlockedPath(path: string): boolean {
  return /^\/(quote|contact|admin|sign-in|sign-up)(\/|$|\?)/.test(path);
}

export function resolvePublicImage(path: string | null, base: string): string | null {
  if (!path || !/^\/images\/[a-zA-Z0-9_/-]+\.(?:webp|png|jpe?g)$/i.test(path)) return null;
  return `${base.replace(/\/$/, "")}${path}`;
}

export function formatPurchaseDate(iso: string, market: "US" | "CA"): string {
  return new Intl.DateTimeFormat(market === "CA" ? "en-CA" : "en-US", { dateStyle: "medium" }).format(new Date(iso));
}
