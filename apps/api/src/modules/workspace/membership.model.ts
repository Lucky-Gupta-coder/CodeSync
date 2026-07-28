import mongoose, { Schema, Document } from "mongoose";
import { MembershipRole } from "@codesync/types";

export interface IMembership extends Document {
  workspace: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: MembershipRole;
  joinedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace ID is required"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    role: {
      type: String,
      enum: Object.values(MembershipRole),
      required: [true, "Membership role is required"],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
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

// Compound unique index to prevent duplicate memberships in the same workspace
MembershipSchema.index({ workspace: 1, user: 1 }, { unique: true });

export const Membership = mongoose.model<IMembership>("Membership", MembershipSchema);
