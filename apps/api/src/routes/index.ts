import { Router } from "express";
import healthRouter from "./health.routes.js";

const router = Router();

// Mount routes
router.use("/", healthRouter);

export default router;
