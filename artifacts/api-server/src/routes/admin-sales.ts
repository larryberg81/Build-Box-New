import { Router } from "express";
import {
  CreateAdminSaleBody, SetAdminSaleVisibilityBody,
  UpdateAdminSaleParams,
} from "@workspace/api-zod";
import salesAdmin from "../middlewares/salesAdmin.js";

const router = Router();
router.use("/admin", salesAdmin);
router.get("/admin/session", (_req, res) => { res.json({ isAdmin: true }); });

// Imports are lazy: unconfigured Vercel sales storage cannot disable email delivery.
const storage = () => import("../lib/admin-sales-store.js");

router.get("/admin/sales", async (req, res) => {
  try {
    const { listSales } = await storage();
    res.json(await listSales());
  } catch {
    req.log.error("Could not load administrator sales");
    res.status(503).json({ error: "Sales database is unavailable. Please try again." });
  }
});

router.post("/admin/sales", async (req, res) => {
  try {
    const input = CreateAdminSaleBody.strict().safeParse(req.body);
    if (!input.success) {
      res.status(400).json({ error: "Complete all fields and confirm the sale is genuine." });
      return;
    }
    const { saveSale } = await storage();
    const result = await saveSale(input.data);
    res.status(result.status).json(result.body);
  } catch {
    req.log.error("Could not create administrator sale");
    res.status(503).json({ error: "Unable to save the sale. No success was confirmed; refresh before retrying." });
  }
});

router.put("/admin/sales/:id", async (req, res) => {
  const params = UpdateAdminSaleParams.safeParse(req.params);
  const body = CreateAdminSaleBody.strict().safeParse(req.body);
  if (!params.success || !Number.isInteger(params.data.id) || !body.success) {
    res.status(400).json({ error: "Provide a valid sale ID, complete fields and verification." });
    return;
  }
  try {
    const { saveSale } = await storage();
    const result = await saveSale(body.data, params.data.id);
    res.status(result.status).json(result.body);
  } catch {
    req.log.error("Could not update administrator sale");
    res.status(503).json({ error: "Unable to update this sale. Refresh before retrying." });
  }
});

router.patch("/admin/sales/:id/visibility", async (req, res) => {
  const params = UpdateAdminSaleParams.safeParse(req.params);
  const body = SetAdminSaleVisibilityBody.strict().safeParse(req.body);
  if (!params.success || !Number.isInteger(params.data.id) || !body.success) {
    res.status(400).json({ error: "Provide a valid sale ID and display approval." });
    return;
  }
  try {
    const { setSaleVisibility } = await storage();
    const result = await setSaleVisibility(params.data.id, body.data.displayApproved);
    res.status(result.status).json(result.body);
  } catch {
    req.log.error("Could not change sale visibility");
    res.status(503).json({ error: "Unable to change visibility. Refresh before retrying." });
  }
});

export default router;
