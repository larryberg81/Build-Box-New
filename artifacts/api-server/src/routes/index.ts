import { Router } from "express";
import healthRouter from "./health.js";
import contactRouter from "./contact.js";
import exchangeRateRouter from "./exchange-rate.js";

const router = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(exchangeRateRouter);

export default router;
