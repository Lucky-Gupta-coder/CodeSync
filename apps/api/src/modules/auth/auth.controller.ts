import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";
import { UnauthorizedError } from "../../shared/errors/unauthorized-error.js";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Call service layer business logic (body is validated by middleware)
      const userDto = await authService.register(req.body);

      // Respond with structured standard success payload
      res.status(201).json({
        success: true,
        message: "Account created successfully",
        user: userDto,
        data: userDto,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Call authentication login logic (body is validated by middleware)
      const result = await authService.login(req.body);

      // Respond with structured token and DTO payload
      res.status(200).json({
        success: true,
        message: "Login successful",
        token: result.accessToken,
        user: result.user,
        data: {
          token: result.accessToken,
          accessToken: result.accessToken,
          user: result.user,
        },
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
        user: req.user,
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
