import { Router } from "express";
import healthRouter from "./health.routes.js";
import authRouter from "../modules/auth/auth.routes.js";
import debugRouter from "./debug.routes.js";
import workspaceRouter from "../modules/workspace/workspace.routes.js";
import roomRouter from "../modules/room/room.routes.js";

const router = Router();

// Mount routes
router.use("/", healthRouter);
router.use("/auth", authRouter);
router.use("/workspaces", workspaceRouter);
router.use("/rooms", roomRouter);

// Mount debug routes only in non-production environments
if (process.env.NODE_ENV !== "production") {
  router.use("/debug", debugRouter);
}

export default router;
