import { z } from "zod";

export const UserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  email: z.string().email("Invalid email address"),
});

export type UserInput = z.infer<typeof UserSchema>;
