import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { logger } from "./config/logger.js";
import { rateLimiter } from "./middleware/rate-limit.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import apiRouter from "./routes/index.js";

const app = express();

// Set security HTTP headers
app.use(helmet());

const allowedOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://[::1]:5173",
];

// Enable CORS
app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow requests with no origin (like mobile apps, curl)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Integrate Morgan logging into winston stream
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// Apply rate limiter to all api routes
app.use("/api", rateLimiter);

// API router
app.use("/api", apiRouter);

// Health check fallback at root level
app.get("/", (_req, res) => {
  res.status(200).send("CodeSync API is running");
});

// Error handling middleware
app.use(errorHandler);

export default app;
