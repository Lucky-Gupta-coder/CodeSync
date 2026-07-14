import { Request, Response, NextFunction } from "express";
import { jwtService } from "../shared/auth/jwt.service.js";
import { userService } from "../modules/user/user.service.js";
import { mapToUserDTO } from "../modules/user/user.mapper.js";
import { UnauthorizedError } from "../shared/errors/unauthorized-error.js";
import { logger } from "../config/logger.js";
import { UserResponseDTO } from "@codesync/types";

// Declaration merging to append user property to Express.Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserResponseDTO;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn("Authentication failed: Missing Authorization header");
    next(new UnauthorizedError("Authentication token is required"));
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    logger.warn("Authentication failed: Malformed Authorization header");
    next(new UnauthorizedError("Malformed authentication header. Format must be: Bearer <token>"));
    return;
  }

  const token = parts[1];

  try {
    // Verify Access Token via our central JWT service
    const payload = await jwtService.verifyAccessToken(token);

    const userId = payload.sub;
    if (!userId) {
      logger.warn("Authentication failed: Subject (sub) missing from payload");
      next(new UnauthorizedError("Invalid token payload"));
      return;
    }

    const user = await userService.findUserById(userId);
    if (!user) {
      logger.warn(`Authentication failed: User ID not found - ${userId}`);
      next(new UnauthorizedError("User account not found"));
      return;
    }

    // Attach mapped user DTO to request context
    req.user = mapToUserDTO(user);
    next();
  } catch (error) {
    const err = error as { name?: string; code?: string; message?: string };
    if (err.name === "JWTExpired" || err.code === "ERR_JWT_EXPIRED") {
      logger.warn("Authentication failed: Token has expired");
      next(new UnauthorizedError("Token has expired"));
      return;
    }

    logger.warn(`Authentication failed: Invalid token - ${err.message || err}`);
    next(new UnauthorizedError("Invalid or expired authentication token"));
  }
};
