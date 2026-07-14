import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { logger } from "./config/logger.js";

const port = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  const server = app.listen(port, () => {
    logger.info(
      `Server is running in ${process.env.NODE_ENV || "development"} mode on port ${port}`
    );
  });

  // Graceful shutdown handler
  const shutdown = async () => {
    logger.info("Shutdown signal received. Gracefully closing resources...");
    server.close(async () => {
      logger.info("Express server closed.");
      const { disconnectDB } = await import("./config/db.js");
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

startServer().catch((error) => {
  logger.error(`Critical server initialization error: ${error}`);
  process.exit(1);
});
