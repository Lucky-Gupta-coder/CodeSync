import { Types } from "mongoose";
import { FileNode, IFileNode } from "./file.model.js";
import { FileCreateInput, FileUpdateInput } from "@codesync/validators";
import { FileNodeDTO, FileType } from "@codesync/types";
import { ConflictError } from "../../shared/errors/conflict-error.js";
import { NotFoundError } from "../../shared/errors/not-found-error.js";
import { BadRequestError } from "../../shared/errors/bad-request-error.js";
import { documentService } from "../../realtime/services/document.service.js";

const MAX_NESTING_DEPTH = 10;

export class FileService {
  /**
   * Retrieves all files and folders for a given room.
   */
  async getRoomFiles(roomId: string): Promise<FileNodeDTO[]> {
    const files = await FileNode.find({ room: roomId }).sort({ type: -1, name: 1 }); // Folders first, then alphabetical
    return files.map(this.mapToDTO);
  }

  /**
   * Creates a new file or folder.
   */
  async createFile(roomId: string, data: FileCreateInput): Promise<FileNodeDTO> {
    if (data.parentId) {
      await this.validateParent(data.parentId, roomId);
      await this.validateDepth(data.parentId);
    }

    // Check for duplicate name
    const existing = await FileNode.findOne({
      room: roomId,
      parentId: data.parentId || null,
      name: data.name,
    });

    if (existing) {
      throw new ConflictError(
        `A ${existing.type.toLowerCase()} with this name already exists in this directory`
      );
    }

    const file = await FileNode.create({
      room: new Types.ObjectId(roomId),
      name: data.name,
      type: data.type,
      parentId: data.parentId ? new Types.ObjectId(data.parentId) : null,
    });

    return this.mapToDTO(file);
  }

  /**
   * Updates a file or folder (rename or move).
   */
  async updateFile(roomId: string, fileId: string, data: FileUpdateInput): Promise<FileNodeDTO> {
    const file = await FileNode.findOne({ _id: fileId, room: roomId });
    if (!file) {
      throw new NotFoundError("File or folder not found");
    }

    // Moving to a new parent
    if (data.parentId !== undefined) {
      if (data.parentId === fileId) {
        throw new BadRequestError("A folder cannot be its own parent");
      }

      if (data.parentId) {
        await this.validateParent(data.parentId, roomId);

        // Prevent moving a folder into one of its own subfolders
        if (file.type === FileType.FOLDER) {
          await this.validateNotSubfolder(data.parentId, fileId);
        }

        // Temporarily assign new parent to check depth
        await this.validateDepth(data.parentId);
      }
      file.parentId = data.parentId ? new Types.ObjectId(data.parentId) : null;
    }

    // Renaming
    if (data.name !== undefined) {
      file.name = data.name;
    }

    // Check for naming collisions if name or parent changed
    if (data.name !== undefined || data.parentId !== undefined) {
      const existing = await FileNode.findOne({
        room: roomId,
        parentId: file.parentId,
        name: file.name,
        _id: { $ne: file._id },
      });

      if (existing) {
        throw new ConflictError(
          `A ${existing.type.toLowerCase()} with this name already exists in this directory`
        );
      }
    }

    await file.save();
    return this.mapToDTO(file);
  }

  /**
   * Deletes a file or folder (cascading).
   */
  async deleteFile(roomId: string, fileId: string): Promise<void> {
    const file = await FileNode.findOne({ _id: fileId, room: roomId });
    if (!file) {
      throw new NotFoundError("File or folder not found");
    }

    const idsToDelete = [file._id];

    if (file.type === FileType.FOLDER) {
      // Find all nested children to delete
      const childrenIds = await this.getAllChildrenIds(file._id);
      idsToDelete.push(...childrenIds);
    }

    // Delete all matched FileNodes
    await FileNode.deleteMany({ _id: { $in: idsToDelete } });

    // Clean up associated Yjs Documents and real-time state
    // For every file being deleted, we must remove its collaborative document
    const deletePromises = idsToDelete.map(async (id) => {
      // fileId in documentService is the stringified ObjectId of the FileNode
      const idStr = id.toString();
      // Remove from DB (assuming there's a mongoose DocumentModel for this)
      await documentService.cleanupDocument(roomId, idStr);
      // Optional: actually delete it from MongoDB if cleanupDocument only saves it.
      // But typically we should delete the document record entirely if the file is deleted.
      const { DocumentModel } = await import("../../modules/document/document.model.js");
      await DocumentModel.deleteOne({ room: roomId, fileId: idStr });
    });

    await Promise.all(deletePromises);
  }

  // --- Helper Methods ---

  private async validateParent(parentId: string, roomId: string) {
    const parent = await FileNode.findOne({ _id: parentId, room: roomId });
    if (!parent) {
      throw new NotFoundError("Parent directory not found");
    }
    if (parent.type !== FileType.FOLDER) {
      throw new BadRequestError("Parent must be a folder");
    }
  }

  private async validateDepth(parentId: string) {
    let depth = 1;
    let currentId: Types.ObjectId | null = new Types.ObjectId(parentId);

    while (currentId) {
      if (depth >= MAX_NESTING_DEPTH) {
        throw new BadRequestError(`Maximum folder nesting depth of ${MAX_NESTING_DEPTH} reached`);
      }
      const parent: any = await FileNode.findById(currentId);
      currentId = parent?.parentId || null;
      depth++;
    }
  }

  private async validateNotSubfolder(targetParentId: string, folderId: string) {
    let currentId: Types.ObjectId | null = new Types.ObjectId(targetParentId);

    while (currentId) {
      if (currentId.toString() === folderId) {
        throw new BadRequestError("Cannot move a folder into its own subfolder");
      }
      const parent: any = await FileNode.findById(currentId);
      currentId = parent?.parentId || null;
    }
  }

  private async getAllChildrenIds(parentId: Types.ObjectId): Promise<Types.ObjectId[]> {
    const children = await FileNode.find({ parentId });
    let ids: Types.ObjectId[] = [];

    for (const child of children) {
      ids.push(child._id as Types.ObjectId);
      if (child.type === FileType.FOLDER) {
        const subChildren = await this.getAllChildrenIds(child._id as Types.ObjectId);
        ids = ids.concat(subChildren);
      }
    }

    return ids;
  }

  private mapToDTO(file: IFileNode): FileNodeDTO {
    return {
      id: file._id.toString(),
      roomId: file.room.toString(),
      name: file.name,
      type: file.type,
      parentId: file.parentId ? file.parentId.toString() : null,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
    };
  }
}

export const fileService = new FileService();
