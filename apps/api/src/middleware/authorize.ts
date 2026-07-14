import { Request, Response, NextFunction } from "express";
import { UserRole } from "@codesync/types";
import { UnauthorizedError } from "../shared/errors/unauthorized-error.js";
import { ForbiddenError } from "../shared/errors/forbidden-error.js";

/**
 * Middleware factory to authorize users based on their role
 * Must be mounted AFTER the authenticate middleware
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // If authenticate middleware has not run or user is not attached
    if (!req.user) {
      next(new UnauthorizedError("Authentication required"));
      return;
    }

    // If roles list is specified and user's role is not matched
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next(new ForbiddenError("Access denied: insufficient permissions"));
      return;
    }

    next();
  };
};
