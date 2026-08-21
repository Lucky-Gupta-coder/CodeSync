import mongoose, { Schema, Document } from "mongoose";
import { FileType } from "@codesync/types";

export interface IFileNode extends Document {
  room: mongoose.Types.ObjectId;
  name: string;
  type: FileType;
  parentId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const FileNodeSchema = new Schema<IFileNode>(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [1, "Name must be at least 1 character"],
      maxlength: [255, "Name must not exceed 255 characters"],
    },
    type: {
      type: String,
      enum: Object.values(FileType),
      required: [true, "File type is required"],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "FileNode",
      default: null,
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

// Compound unique index to prevent duplicate names in the same folder
// A null parentId will be considered the same value for unique indexing
FileNodeSchema.index({ room: 1, parentId: 1, name: 1 }, { unique: true });

export const FileNode = mongoose.model<IFileNode>("FileNode", FileNodeSchema);
