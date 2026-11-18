import { Router } from "express";
import { GetSalesNotificationsQueryParams } from "@workspace/api-zod";

const router = Router();

// Deliberately read-only: site visitors cannot insert or approve purchase claims.
router.get("/sales-notifications", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const parsed = GetSalesNotificationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Country must be US or CA." });
    return;
  }
  try {
    // A missing database must not take down Vercel's existing email API.
    if (!process.env.DATABASE_URL) throw new Error("Sales database is not configured");
    const { readSalesFeed } = await import("../lib/sales-feed.js");
    res.json(await readSalesFeed(parsed.data.country));
  } catch (error) {
    req.log.error({ err: error }, "Sales notifications unavailable");
    res.status(503).json({ error: "Sales notifications are temporarily unavailable." });
  }
});

export default router;
