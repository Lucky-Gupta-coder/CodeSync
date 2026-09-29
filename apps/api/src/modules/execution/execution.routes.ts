import { Router } from "express";
import { executeCodeHandler } from "./execution.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

router.post("/run", authenticate, executeCodeHandler);

export default router;
