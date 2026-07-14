import mongoose, { Schema, Document } from "mongoose";
import { UserRole } from "@codesync/types";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  role: UserRole;
  isVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [50, "Name must not exceed 50 characters"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.MEMBER,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const sanitized = ret as Record<string, unknown>;
        sanitized.id = String(sanitized._id);
        delete sanitized._id;
        delete sanitized.__v;
        delete sanitized.passwordHash;
        return sanitized;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        const sanitized = ret as Record<string, unknown>;
        sanitized.id = String(sanitized._id);
        delete sanitized._id;
        delete sanitized.__v;
        delete sanitized.passwordHash;
        return sanitized;
      },
    },
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);
