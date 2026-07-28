import { Workspace, IWorkspace } from "./workspace.model.js";
import { Membership } from "./membership.model.js";
import { Room } from "../room/room.model.js";
import { ConflictError } from "../../shared/errors/conflict-error.js";
import { NotFoundError } from "../../shared/errors/not-found-error.js";
import { BadRequestError } from "../../shared/errors/bad-request-error.js";
import { logger } from "../../config/logger.js";
import { WorkspaceVisibility, MembershipRole, WorkspaceDTO } from "@codesync/types";
import mongoose from "mongoose";

export class WorkspaceService {
  private mapToDTO(workspace: IWorkspace): WorkspaceDTO {
    return {
      id: String(workspace._id),
      name: workspace.name,
      description: workspace.description || "",
      owner: String(workspace.owner),
      visibility: workspace.visibility as WorkspaceVisibility,
      isArchived: workspace.isArchived,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  }

  async createWorkspace(
    data: { name: string; description?: string; visibility?: WorkspaceVisibility },
    ownerId: string
  ): Promise<WorkspaceDTO> {
    const { name, description = "", visibility = WorkspaceVisibility.PRIVATE } = data;

    // Check for duplicate workspace names under the same owner
    const existing = await Workspace.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      owner: ownerId,
    });
    if (existing) {
      logger.warn(`Workspace creation failed: Duplicate name '${name}' for owner ${ownerId}`);
      throw new ConflictError("A workspace with this name already exists");
    }

    // Use a session transaction to ensure workspace + membership are both created
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [workspace] = await Workspace.create(
        [
          {
            name: name.trim(),
            description: description.trim(),
            owner: ownerId,
            visibility,
            isArchived: false,
          },
        ],
        { session }
      );

      // Create owner membership record
      await Membership.create(
        [
          {
            workspace: workspace._id,
            user: ownerId,
            role: MembershipRole.OWNER,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      logger.info(
        `Workspace created successfully: ${workspace.name} (ID: ${workspace._id}) by owner ${ownerId}`
      );

      return this.mapToDTO(workspace);
    } catch (error) {
      await session.abortTransaction();
      logger.error(`Failed to create workspace ${name}: ${error}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateWorkspace(
    id: string,
    data: { name?: string; description?: string; visibility?: WorkspaceVisibility }
  ): Promise<WorkspaceDTO> {
    const workspace = await Workspace.findById(id);
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    if (workspace.isArchived) {
      throw new BadRequestError("Cannot modify an archived workspace");
    }

    if (data.name && data.name.trim().toLowerCase() !== workspace.name.toLowerCase()) {
      const existing = await Workspace.findOne({
        name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
        owner: workspace.owner,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictError("A workspace with this name already exists");
      }
      workspace.name = data.name.trim();
    }

    if (data.description !== undefined) {
      workspace.description = data.description.trim();
    }

    if (data.visibility !== undefined) {
      workspace.visibility = data.visibility;
    }

    await workspace.save();
    logger.info(`Workspace updated successfully: ${workspace.name} (ID: ${id})`);

    return this.mapToDTO(workspace);
  }

  async archiveWorkspace(id: string): Promise<WorkspaceDTO> {
    const workspace = await Workspace.findByIdAndUpdate(id, { isArchived: true }, { new: true });
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    logger.info(`Workspace archived successfully: (ID: ${id})`);
    return this.mapToDTO(workspace);
  }

  async restoreWorkspace(id: string): Promise<WorkspaceDTO> {
    const workspace = await Workspace.findByIdAndUpdate(id, { isArchived: false }, { new: true });
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    logger.info(`Workspace restored successfully: (ID: ${id})`);
    return this.mapToDTO(workspace);
  }

  async deleteWorkspace(id: string): Promise<void> {
    const workspace = await Workspace.findById(id);
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Cascading delete
      await Workspace.deleteOne({ _id: id }).session(session);
      await Membership.deleteMany({ workspace: id }).session(session);
      await Room.deleteMany({ workspace: id }).session(session);

      await session.commitTransaction();
      logger.info(`Workspace deleted successfully (cascaded rooms & memberships): (ID: ${id})`);
    } catch (error) {
      await session.abortTransaction();
      logger.error(`Failed to delete workspace ${id}: ${error}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getWorkspaceById(id: string): Promise<WorkspaceDTO> {
    const workspace = await Workspace.findById(id);
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }
    return this.mapToDTO(workspace);
  }

  async getUserWorkspaces(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ workspaces: WorkspaceDTO[]; total: number; pages: number }> {
    const memberships = await Membership.find({ user: userId });
    const workspaceIds = memberships.map((m) => m.workspace);

    const query = {
      $or: [{ owner: userId }, { _id: { $in: workspaceIds } }],
    };

    const total = await Workspace.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    const list = await Workspace.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      workspaces: list.map((w) => this.mapToDTO(w)),
      total,
      pages,
    };
  }

  async searchWorkspaces(
    userId: string,
    term: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ workspaces: WorkspaceDTO[]; total: number; pages: number }> {
    const memberships = await Membership.find({ user: userId });
    const workspaceIds = memberships.map((m) => m.workspace);

    const query = {
      name: { $regex: term, $options: "i" },
      $or: [
        { owner: userId },
        { _id: { $in: workspaceIds } },
        { visibility: WorkspaceVisibility.PUBLIC },
      ],
    };

    const total = await Workspace.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    const list = await Workspace.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      workspaces: list.map((w) => this.mapToDTO(w)),
      total,
      pages,
    };
  }
}

export const workspaceService = new WorkspaceService();
