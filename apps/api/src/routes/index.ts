import { Router } from "express";
import healthRouter from "./health.routes.js";
import authRouter from "../modules/auth/auth.routes.js";

const router = Router();

// Mount routes
router.use("/", healthRouter);
router.use("/auth", authRouter);

export default router;
