import { z } from "zod";

export const RegisterSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must not exceed 50 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email format"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must not exceed 64 characters")
    .refine((val) => /[a-z]/.test(val), "Password must contain at least one lowercase letter")
    .refine((val) => /[A-Z]/.test(val), "Password must contain at least one uppercase letter")
    .refine((val) => /\d/.test(val), "Password must contain at least one number")
    .refine(
      (val) => /[^A-Za-z0-9]/.test(val),
      "Password must contain at least one special character"
    ),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
