import { clerkClient, clerkMiddleware, getAuth } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { Router } from "express";
import { getClerkProxyHost } from "./clerkProxyMiddleware.js";
import { isSalesOwner, isSameOriginWrite } from "../lib/admin-authorization.js";

const router = Router();
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY || !process.env.SALES_ADMIN_EMAIL) {
    res.status(503).json({ error: "Administrator sign-in is not configured." });
    return;
  }
  next();
});

// Scoped to the owner API, so missing auth settings cannot break quote emails or the public site.
router.use(clerkMiddleware((req) => ({
  publishableKey: publishableKeyFromHost(
    getClerkProxyHost(req) ?? "",
    process.env.CLERK_PUBLISHABLE_KEY,
  ),
})));

router.use(async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to manage sales." });
    return;
  }
  try {
    const user = await clerkClient.users.getUser(userId);
    if (!isSalesOwner(user, process.env.SALES_ADMIN_EMAIL)) {
      res.status(403).json({ error: "This account does not have sales administrator access." });
      return;
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)
      && !isSameOriginWrite(req.get("origin"), getClerkProxyHost(req))) {
      res.status(403).json({ error: "Sales changes must be submitted from this website." });
      return;
    }
    next();
  } catch {
    req.log.warn("Could not verify sales administrator identity");
    res.status(503).json({ error: "Unable to verify administrator access. Please try again." });
  }
});

export default router;
