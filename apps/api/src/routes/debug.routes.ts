import { Router } from "express";
import { getDatabaseDebug } from "../controllers/debug.controller.js";

const router = Router();

router.get("/database", getDatabaseDebug);

export default router;
