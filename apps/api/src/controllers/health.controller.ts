import { Request, Response, NextFunction } from "express";
import { HealthCheckResponse } from "@codesync/types";
import { getDBStatus } from "../config/db.js";

export const getHealth = (
  _req: Request,
  res: Response<HealthCheckResponse>,
  next: NextFunction
): void => {
  try {
    const dbStatus = getDBStatus();

    res.status(200).json({
      status: dbStatus === "connected" ? "ok" : "error",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      services: {
        database: dbStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};
