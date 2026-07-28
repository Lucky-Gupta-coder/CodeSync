import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { RegisterSchema, LoginSchema } from "./auth.validation.js";

const router = Router();

router.post(
  "/register",
  validateRequest(RegisterSchema),
  authController.register.bind(authController)
);
router.post(
  "/signup",
  validateRequest(RegisterSchema),
  authController.register.bind(authController)
);
router.post("/login", validateRequest(LoginSchema), authController.login.bind(authController));
router.get("/me", authenticate, authController.getCurrentUser.bind(authController));

export default router;
