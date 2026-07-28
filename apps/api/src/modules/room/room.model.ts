import mongoose, { Schema, Document } from "mongoose";
import { RoomLanguage, RoomStatus } from "@codesync/types";

export interface IRoom extends Document {
  workspace: mongoose.Types.ObjectId;
  name: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  language: RoomLanguage;
  status: RoomStatus;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Parent Workspace ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      minlength: [3, "Room name must be at least 3 characters"],
      maxlength: [50, "Room name must not exceed 50 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "Description must not exceed 200 characters"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Room owner is required"],
      index: true,
    },
    language: {
      type: String,
      enum: Object.values(RoomLanguage),
      default: RoomLanguage.JAVASCRIPT,
    },
    status: {
      type: String,
      enum: Object.values(RoomStatus),
      default: RoomStatus.ACTIVE,
      index: true,
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
        return sanitized;
      },
    },
  }
);

// Unique room name constraint within the same workspace
RoomSchema.index({ workspace: 1, name: 1 }, { unique: true });

export const Room = mongoose.model<IRoom>("Room", RoomSchema);
