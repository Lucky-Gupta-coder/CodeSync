import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";

export interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isZodError = err.name === "ZodError" || err instanceof ZodError;
  const statusCode = isZodError ? 400 : err.statusCode || 500;
  const message = isZodError ? "Validation Error" : err.message || "Internal Server Error";

  if (statusCode >= 500) {
    logger.error(
      `[${req.method}] ${req.originalUrl} - Status: ${statusCode} - Message: ${message}`
    );
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - Status: ${statusCode} - Message: ${message}`);
  }

  if (isZodError) {
    const zodError = err as ZodError;
    res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: zodError.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "An unexpected error occurred"
        : message,
  });
};
