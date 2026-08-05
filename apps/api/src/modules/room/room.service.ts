import { Room, IRoom } from "./room.model.js";
import { Workspace } from "../workspace/workspace.model.js";
import { ConflictError } from "../../shared/errors/conflict-error.js";
import { NotFoundError } from "../../shared/errors/not-found-error.js";
import { BadRequestError } from "../../shared/errors/bad-request-error.js";
import { logger } from "../../config/logger.js";
import { RoomLanguage, RoomStatus, RoomDTO } from "@codesync/types";

export class RoomService {
  private mapToDTO(room: IRoom): RoomDTO {
    return {
      id: String(room._id),
      workspace: String(room.workspace),
      name: room.name,
      description: room.description || "",
      owner: String(room.owner),
      language: room.language as RoomLanguage,
      status: room.status as RoomStatus,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    };
  }

  async createRoom(
    data: { name: string; description?: string; language?: RoomLanguage },
    workspaceId: string,
    ownerId: string
  ): Promise<RoomDTO> {
    const { name, description = "", language = RoomLanguage.JAVASCRIPT } = data;

    // Check if parent workspace is archived
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }
    if (workspace.isArchived) {
      throw new BadRequestError("Cannot create rooms in an archived workspace");
    }

    // Check for duplicate room name inside same workspace
    const existing = await Room.findOne({
      workspace: workspaceId,
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      logger.warn(`Room creation failed: Duplicate name '${name}' in workspace ${workspaceId}`);
      throw new ConflictError("A room with this name already exists in this workspace");
    }

    const room = await Room.create({
      workspace: workspaceId,
      name: name.trim(),
      description: description.trim(),
      owner: ownerId,
      language,
      status: RoomStatus.ACTIVE,
    });

    logger.info(
      `Room created successfully: ${room.name} (ID: ${room._id}) in workspace ${workspaceId}`
    );
    return this.mapToDTO(room);
  }

  async updateRoom(
    id: string,
    data: { name?: string; description?: string; language?: RoomLanguage; status?: RoomStatus }
  ): Promise<RoomDTO> {
    const room = await Room.findById(id);
    if (!room) {
      throw new NotFoundError("Room not found");
    }

    // Block modifications on archived rooms (except if we are restoring them to ACTIVE status)
    if (room.status === RoomStatus.ARCHIVED && data.status !== RoomStatus.ACTIVE) {
      throw new BadRequestError("Cannot modify an archived room");
    }

    // Block modifications if parent workspace is archived
    const workspace = await Workspace.findById(room.workspace);
    if (workspace && workspace.isArchived) {
      throw new BadRequestError("Cannot modify rooms in an archived workspace");
    }

    if (data.name && data.name.trim().toLowerCase() !== room.name.toLowerCase()) {
      const existing = await Room.findOne({
        workspace: room.workspace,
        name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictError("A room with this name already exists in this workspace");
      }
      room.name = data.name.trim();
    }

    if (data.description !== undefined) {
      room.description = data.description.trim();
    }

    if (data.language !== undefined) {
      room.language = data.language;
    }

    if (data.status !== undefined) {
      room.status = data.status;
    }

    await room.save();
    logger.info(`Room updated successfully: ${room.name} (ID: ${id})`);

    return this.mapToDTO(room);
  }

  async archiveRoom(id: string): Promise<RoomDTO> {
    return this.updateRoom(id, { status: RoomStatus.ARCHIVED });
  }

  async restoreRoom(id: string): Promise<RoomDTO> {
    return this.updateRoom(id, { status: RoomStatus.ACTIVE });
  }

  async deleteRoom(id: string): Promise<void> {
    const room = await Room.findById(id);
    if (!room) {
      throw new NotFoundError("Room not found");
    }

    // Block deletion if parent workspace is archived
    const workspace = await Workspace.findById(room.workspace);
    if (workspace && workspace.isArchived) {
      throw new BadRequestError("Cannot delete rooms in an archived workspace");
    }

    await Room.deleteOne({ _id: id });
    logger.info(`Room deleted successfully: (ID: ${id})`);
  }

  async getRoom(id: string): Promise<RoomDTO> {
    const room = await Room.findById(id);
    if (!room) {
      throw new NotFoundError("Room not found");
    }
    return this.mapToDTO(room);
  }

  async getWorkspaceRooms(
    workspaceId: string,
    options?: {
      search?: string;
      language?: string;
      status?: string;
      owner?: string;
      sortBy?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    rooms: RoomDTO[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }> {
    const query: Record<string, unknown> = { workspace: workspaceId };

    if (options?.search) {
      const searchRegex = new RegExp(options.search, "i");
      query.$or = [{ name: searchRegex }, { description: searchRegex }, { language: searchRegex }];
    }

    if (options?.language && options.language !== "ALL" && options.language !== "all") {
      query.language = options.language.toLowerCase();
    }

    if (options?.status && options.status !== "ALL" && options.status !== "all") {
      query.status = options.status.toUpperCase();
    }

    if (options?.owner) {
      query.owner = options.owner;
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    switch (options?.sortBy) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "updated":
      case "recently_updated":
        sortOption = { updatedAt: -1 };
        break;
      case "alphabetical":
      case "name":
        sortOption = { name: 1 };
        break;
      case "language":
        sortOption = { language: 1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, options?.limit || 10);

    const total = await Room.countDocuments(query);
    const pages = Math.ceil(total / limit) || 1;

    const list = await Room.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      rooms: list.map((r) => this.mapToDTO(r)),
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  }
}

export const roomService = new RoomService();
