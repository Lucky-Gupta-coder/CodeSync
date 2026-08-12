import { logger } from "../../config/logger.js";

export const socketLogger = {
  info: (message: string, meta?: unknown) => logger.info(`[Socket] ${message}`, meta),
  error: (message: string, meta?: unknown) => logger.error(`[Socket] ${message}`, meta),
  warn: (message: string, meta?: unknown) => logger.warn(`[Socket] ${message}`, meta),
  debug: (message: string, meta?: unknown) => logger.debug(`[Socket] ${message}`, meta),
};
