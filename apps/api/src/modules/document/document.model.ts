import mongoose, { Document, Schema } from "mongoose";

export interface IDocument extends Document {
  workspace: mongoose.Types.ObjectId;
  room: mongoose.Types.ObjectId;
  fileId: string;
  state: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    fileId: {
      type: String,
      required: true,
      index: true,
    },
    state: {
      type: Buffer,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find a specific document in a room
DocumentSchema.index({ room: 1, fileId: 1 }, { unique: true });

export const DocumentModel = mongoose.model<IDocument>("Document", DocumentSchema);
