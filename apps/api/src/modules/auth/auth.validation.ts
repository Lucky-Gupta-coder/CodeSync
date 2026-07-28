import { z } from "zod";
import { SignupSchema, LoginSchema as SharedLoginSchema } from "@codesync/validators";

export const RegisterSchema = SignupSchema;
export const LoginSchema = SharedLoginSchema;

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
