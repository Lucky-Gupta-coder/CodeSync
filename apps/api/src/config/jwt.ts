import { z } from "zod";

const jwtEnvSchema = z.object({
  JWT_ACCESS_SECRET: z
    .string({
      required_error: "JWT_ACCESS_SECRET is required",
    })
    .min(1, "JWT_ACCESS_SECRET cannot be empty"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
});

const rawSecret = process.env.JWT_ACCESS_SECRET;
const isTest = process.env.NODE_ENV === "test";

const envToValidate = {
  JWT_ACCESS_SECRET:
    rawSecret || (isTest ? "test_secret_for_jwt_validation_purposes_only_12345" : undefined),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
};

const result = jwtEnvSchema.safeParse(envToValidate);

if (!result.success) {
  const errorMsg = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
  throw new Error(`JWT Configuration validation failed: ${errorMsg}`);
}

export const jwtConfig = {
  accessSecret: result.data.JWT_ACCESS_SECRET,
  accessExpiresIn: result.data.JWT_ACCESS_EXPIRES_IN,
};
