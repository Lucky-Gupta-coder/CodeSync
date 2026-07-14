import mongoose from "mongoose";
import { logger } from "./logger.js";

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/codesync";

  try {
    mongoose.connection.on("connecting", () => {
      logger.info("Connecting to MongoDB...");
    });

    mongoose.connection.on("connected", () => {
      logger.info("MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB connection lost. Reconnecting...");
    });

    await mongoose.connect(mongoUri);
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error}`);
    // In production, we might want to exit the process
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected successfully");
  } catch (error) {
    logger.error(`Error disconnecting MongoDB: ${error}`);
  }
};

export const getDBStatus = (): "connected" | "disconnected" => {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
};
