import { Router } from "express";
import healthRouter from "./health.routes.js";
import authRouter from "../modules/auth/auth.routes.js";
import debugRouter from "./debug.routes.js";

const router = Router();

// Mount routes
router.use("/", healthRouter);
router.use("/auth", authRouter);

// Mount debug routes only in non-production environments
if (process.env.NODE_ENV !== "production") {
  router.use("/debug", debugRouter);
}

export default router;
