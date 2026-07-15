import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
