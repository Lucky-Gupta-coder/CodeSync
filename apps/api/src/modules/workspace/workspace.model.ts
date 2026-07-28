import mongoose, { Schema, Document } from "mongoose";
import { WorkspaceVisibility } from "@codesync/types";

export interface IWorkspace extends Document {
  name: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  visibility: WorkspaceVisibility;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: [true, "Workspace name is required"],
      trim: true,
      minlength: [3, "Workspace name must be at least 3 characters"],
      maxlength: [50, "Workspace name must not exceed 50 characters"],
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
      required: [true, "Workspace owner is required"],
      index: true,
    },
    visibility: {
      type: String,
      enum: Object.values(WorkspaceVisibility),
      default: WorkspaceVisibility.PRIVATE,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
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

export const Workspace = mongoose.model<IWorkspace>("Workspace", WorkspaceSchema);
