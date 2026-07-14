import { Request, Response, NextFunction } from "express";
import { RegisterSchema } from "./auth.validation.js";
import { authService } from "./auth.service.js";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedInput = RegisterSchema.parse(req.body);

      // Call service layer business logic
      const userDto = await authService.register(validatedInput);

      // Respond with structured standard success payload
      res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: userDto,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
