import mongoose, { Schema, Document } from "mongoose";

export interface IWhiteboard extends Document {
  workspace: mongoose.Types.ObjectId;
  room: mongoose.Types.ObjectId;
  objects: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

const WhiteboardSchema = new Schema<IWhiteboard>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace ID is required"],
      index: true,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room ID is required"],
      unique: true,
      index: true,
    },
    objects: {
      type: Schema.Types.Mixed,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const WhiteboardModel = mongoose.model<IWhiteboard>("Whiteboard", WhiteboardSchema);
