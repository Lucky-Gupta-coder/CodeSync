import { z } from "zod";

export const UserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  email: z.string().email("Invalid email address"),
});

export type UserInput = z.infer<typeof UserSchema>;

export const SignupSchema = z.object({
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

export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email format"),
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

import { WorkspaceVisibility, RoomLanguage, RoomStatus } from "@codesync/types";

export const WorkspaceCreateSchema = z.object({
  name: z
    .string({ required_error: "Workspace name is required" })
    .trim()
    .min(3, "Workspace name must be at least 3 characters")
    .max(50, "Workspace name must not exceed 50 characters"),
  description: z
    .string()
    .trim()
    .max(200, "Description must not exceed 200 characters")
    .default("")
    .optional(),
  visibility: z.nativeEnum(WorkspaceVisibility).default(WorkspaceVisibility.PRIVATE),
});

export type WorkspaceCreateInput = z.infer<typeof WorkspaceCreateSchema>;

export const WorkspaceUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Workspace name must be at least 3 characters")
    .max(50, "Workspace name must not exceed 50 characters")
    .optional(),
  description: z.string().trim().max(200, "Description must not exceed 200 characters").optional(),
  visibility: z.nativeEnum(WorkspaceVisibility).optional(),
});

export type WorkspaceUpdateInput = z.infer<typeof WorkspaceUpdateSchema>;

export const RoomCreateSchema = z.object({
  name: z
    .string({ required_error: "Room name is required" })
    .trim()
    .min(3, "Room name must be at least 3 characters")
    .max(50, "Room name must not exceed 50 characters"),
  description: z
    .string()
    .trim()
    .max(200, "Description must not exceed 200 characters")
    .default("")
    .optional(),
  language: z.nativeEnum(RoomLanguage).default(RoomLanguage.JAVASCRIPT),
});

export type RoomCreateInput = z.infer<typeof RoomCreateSchema>;

export const RoomUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Room name must be at least 3 characters")
    .max(50, "Room name must not exceed 50 characters")
    .optional(),
  description: z.string().trim().max(200, "Description must not exceed 200 characters").optional(),
  language: z.nativeEnum(RoomLanguage).optional(),
  status: z.nativeEnum(RoomStatus).optional(),
});

export type RoomUpdateInput = z.infer<typeof RoomUpdateSchema>;

export const ChatMessageSchema = z
  .object({
    content: z
      .string({ required_error: "Message content is required" })
      .trim()
      .min(1, "Message cannot be empty")
      .max(2000, "Message is too long"),
  })
  .strict();

export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
