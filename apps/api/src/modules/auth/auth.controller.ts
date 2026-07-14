import { Request, Response, NextFunction } from "express";
import { RegisterSchema, LoginSchema } from "./auth.validation.js";
import { authService } from "./auth.service.js";
import { UnauthorizedError } from "../../shared/errors/unauthorized-error.js";

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

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate login request body
      const validatedInput = LoginSchema.parse(req.body);

      // Call authentication login logic
      const result = await authService.login(validatedInput);

      // Respond with structured token and DTO payload
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      // Respond with authenticated user details
      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
