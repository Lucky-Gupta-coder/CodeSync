import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { logger } from "./logger.js";
import { loadedEnvPath } from "./env.js";

let moduleDir = "";
try {
  moduleDir = dirname(fileURLToPath(eval("import.meta.url")));
} catch (e) {
  moduleDir = process.cwd();
}

export const sanitizeMongoUri = (uri: string): string => {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/, "$1******$3");
};

export const connectDB = async (): Promise<void> => {
  let metaUrl = "N/A (CommonJS)";
  try {
    metaUrl = eval("import.meta.url");
  } catch (e) {
    // Ignore ReferenceError in CommonJS testing environments
  }

  // Temporary environment audit logs
  logger.info("ENV FILE AUDIT");
  logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);
  logger.info(`cwd: ${process.cwd()}`);
  logger.info(`import.meta.url: ${metaUrl}`);
  logger.info(`__dirname: ${moduleDir}`);
  logger.info(`Loaded .env file: ${loadedEnvPath || "None loaded"}`);
  logger.info(
    `Resolved MONGO_URI: ${process.env.MONGO_URI ? sanitizeMongoUri(process.env.MONGO_URI) : "Undefined"}`
  );

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    const errorMsg = "MONGO_URI environment variable is missing";
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    mongoose.connection.on("connecting", () => {
      logger.info("Connecting to MongoDB...");
    });

    mongoose.connection.on("connected", () => {
      const collectionCount = Object.keys(mongoose.connection.collections).length;
      logger.info(
        `\n=========================================\n` +
          `MongoDB Connected\n` +
          `Database: ${mongoose.connection.name || ""}\n` +
          `Host: ${mongoose.connection.host || ""}\n` +
          `Collection Count: ${collectionCount}\n` +
          `=========================================`
      );
    });

    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB connection lost. Reconnecting...");
    });

    await mongoose.connect(mongoUri);

    // Database connection verification logs
    logger.info(`Database Name: ${mongoose.connection.name}`);
    logger.info(`Host: ${mongoose.connection.host}`);
    logger.info(`Connection State: ${mongoose.connection.readyState}`);
    logger.info(`Sanitized URI: ${sanitizeMongoUri(mongoUri)}`);
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error}`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    throw error;
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
