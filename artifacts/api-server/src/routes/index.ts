import { Router } from "express";
import healthRouter from "./health.js";
import contactRouter from "./contact.js";
import exchangeRateRouter from "./exchange-rate.js";
import salesRouter from "./sales.js";
import adminSalesRouter from "./admin-sales.js";

const router = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(exchangeRateRouter);
router.use(salesRouter);
router.use(adminSalesRouter);

export default router;
