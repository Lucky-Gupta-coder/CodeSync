import { logger } from "../../config/logger.js";

export const socketLogger = {
  info: (message: string, meta?: any) => logger.info(`[Socket] ${message}`, meta),
  error: (message: string, meta?: any) => logger.error(`[Socket] ${message}`, meta),
  warn: (message: string, meta?: any) => logger.warn(`[Socket] ${message}`, meta),
  debug: (message: string, meta?: any) => logger.debug(`[Socket] ${message}`, meta),
};
