import { Request, Response, NextFunction } from "express";
import { HealthCheckResponse } from "@codesync/types";
import mongoose from "mongoose";
import { getDBStatus } from "../config/db.js";

export const getHealth = (
  _req: Request,
  res: Response<HealthCheckResponse>,
  next: NextFunction
): void => {
  try {
    const dbStatus = getDBStatus();
    const readyState = mongoose.connection.readyState;

    res.status(200).json({
      status: dbStatus === "connected" ? "ok" : "error",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      services: {
        database: dbStatus,
      },
      database: {
        connected: readyState === 1,
        databaseName: mongoose.connection.name || "",
        host: mongoose.connection.host || "",
        readyState: readyState,
      },
    });
  } catch (error) {
    next(error);
  }
};
