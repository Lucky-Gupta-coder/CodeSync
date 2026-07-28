import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { User } from "../modules/user/user.model.js";
import { logger } from "../config/logger.js";

export const getDatabaseDebug = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (process.env.NODE_ENV === "production") {
      res.status(403).json({
        success: false,
        message: "Debug endpoint is disabled in production",
      });
      return;
    }

    const databaseName = mongoose.connection.name || "";
    let collections: string[] = [];
    let usersCount = 0;

    if (mongoose.connection.readyState === 1) {
      if (mongoose.connection.db) {
        const list = await mongoose.connection.db.listCollections().toArray();
        collections = list.map((c) => c.name);
      } else {
        collections = Object.keys(mongoose.connection.collections);
      }
      usersCount = await User.countDocuments();
    }

    res.status(200).json({
      databaseName,
      collections,
      usersCount,
    });
  } catch (error) {
    logger.error(`Debug endpoint error: ${error}`);
    next(error);
  }
};
