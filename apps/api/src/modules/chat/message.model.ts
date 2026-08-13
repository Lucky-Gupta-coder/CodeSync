import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  workspace: mongoose.Types.ObjectId;
  room: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace ID is required"],
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room ID is required"],
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      minlength: [1, "Content cannot be empty"],
      maxlength: [2000, "Content must not exceed 2000 characters"],
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

// Indexes for efficient history retrieval
MessageSchema.index({ room: 1, createdAt: -1 });
MessageSchema.index({ workspace: 1, room: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
