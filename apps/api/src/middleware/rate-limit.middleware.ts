import { rateLimit } from "express-rate-limit";

// Strict validation for benchmark mode
if (process.env.IS_LOCAL_BENCHMARK_MODE === "true" && process.env.NODE_ENV === "production") {
  console.error("FATAL: Cannot enable local benchmark mode in production!");
  process.exit(1);
}

const isBenchmarkMode = process.env.IS_LOCAL_BENCHMARK_MODE === "true";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Allow much higher limits for isolated benchmarking; keep standard limit otherwise
  max: isBenchmarkMode ? 100000 : 100,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  skip: (req) => {
    return req.originalUrl.endsWith("/health") || req.path.endsWith("/health");
  },
});
