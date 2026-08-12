import * as Y from "yjs";
import { DocumentModel } from "../../modules/document/document.model.js";
import { socketLogger } from "../utils/socket.logger.js";
import mongoose from "mongoose";

interface DocumentState {
  doc: Y.Doc;
  saveTimeout: NodeJS.Timeout | null;
  workspaceId: string;
}

const SAVE_DEBOUNCE_MS = 5000; // 5 seconds

import { Room } from "../../modules/room/room.model.js";

export class DocumentService {
  private static instance: DocumentService;
  // Key: roomId:fileId
  private documents = new Map<string, DocumentState>();

  private constructor() {}

  public static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  private getCompositeId(roomId: string, fileId: string): string {
    return `${roomId}:${fileId}`;
  }

  /**
   * Retrieves an in-memory document or loads it from MongoDB.
   */
  public async getDocument(roomId: string, fileId: string): Promise<Y.Doc> {
    const id = this.getCompositeId(roomId, fileId);

    if (this.documents.has(id)) {
      return this.documents.get(id)!.doc;
    }

    const doc = new Y.Doc();
    let workspaceId = "";

    try {
      // Get the workspaceId from the Room
      const room = await Room.findById(roomId);
      if (!room) throw new Error("Room not found");
      workspaceId = room.workspace.toString();

      // Try to load from database
      const savedDoc = await DocumentModel.findOne({ room: roomId, fileId });
      if (savedDoc && savedDoc.state) {
        Y.applyUpdate(doc, new Uint8Array(savedDoc.state));
        socketLogger.info(`Loaded document ${fileId} for room ${roomId} from DB`);
      } else {
        // Create a new record in DB if it doesn't exist
        await DocumentModel.create({
          workspace: new mongoose.Types.ObjectId(workspaceId),
          room: new mongoose.Types.ObjectId(roomId),
          fileId,
          state: Buffer.from(Y.encodeStateAsUpdate(doc)),
        });
        socketLogger.info(`Created new document ${fileId} for room ${roomId} in DB`);
      }
    } catch (error) {
      socketLogger.error(`Error loading document ${fileId} for room ${roomId}`, { error });
      // If error occurs, we still return the empty doc to allow editing,
      // but log it so we know persistence failed.
    }

    this.documents.set(id, {
      doc,
      saveTimeout: null,
      workspaceId,
    });

    return doc;
  }

  /**
   * Applies a binary update to the in-memory Y.Doc and schedules a debounced save.
   */
  public async applyUpdate(roomId: string, fileId: string, update: ArrayBuffer): Promise<void> {
    const id = this.getCompositeId(roomId, fileId);
    let state = this.documents.get(id);

    if (!state) {
      // If not in memory, we must load it first to ensure correct state application
      await this.getDocument(roomId, fileId);
      state = this.documents.get(id);
    }

    if (!state) return;

    try {
      // Apply the incoming update
      Y.applyUpdate(state.doc, new Uint8Array(update));

      this.scheduleSave(roomId, fileId);
    } catch (error) {
      socketLogger.error(`Error applying update to ${fileId} in room ${roomId}`, { error });
    }
  }

  /**
   * Schedules a debounced save to MongoDB.
   */
  private scheduleSave(roomId: string, fileId: string) {
    const id = this.getCompositeId(roomId, fileId);
    const state = this.documents.get(id);
    if (!state) return;

    if (state.saveTimeout) {
      clearTimeout(state.saveTimeout);
    }

    state.saveTimeout = setTimeout(() => {
      this.saveDocument(roomId, fileId).catch((error) => {
        socketLogger.error(`Debounced save failed for ${id}`, { error });
      });
    }, SAVE_DEBOUNCE_MS);
  }

  /**
   * Forces a save of the current in-memory state to MongoDB.
   */
  public async saveDocument(roomId: string, fileId: string): Promise<void> {
    const id = this.getCompositeId(roomId, fileId);
    const state = this.documents.get(id);
    if (!state) return;

    try {
      const encodedState = Y.encodeStateAsUpdate(state.doc);
      await DocumentModel.findOneAndUpdate(
        { room: roomId, fileId },
        {
          state: Buffer.from(encodedState),
          workspace: new mongoose.Types.ObjectId(state.workspaceId),
        },
        { upsert: true, new: true }
      );

      socketLogger.debug(`Saved document ${fileId} in room ${roomId} to DB`);
    } catch (error) {
      socketLogger.error(`Error saving document ${fileId} for room ${roomId}`, { error });
    }
  }

  /**
   * Cleans up the in-memory document, saving it one last time if there are no pending changes.
   */
  public async cleanupDocument(roomId: string, fileId: string): Promise<void> {
    const id = this.getCompositeId(roomId, fileId);
    const state = this.documents.get(id);
    if (!state) return;

    if (state.saveTimeout) {
      clearTimeout(state.saveTimeout);
    }

    // Force save before cleanup
    await this.saveDocument(roomId, fileId);

    // Destroy the document to free memory
    state.doc.destroy();
    this.documents.delete(id);
    socketLogger.info(`Cleaned up document ${fileId} for room ${roomId}`);
  }

  /**
   * Cleans up all documents in a specific room.
   */
  public async cleanupRoom(roomId: string): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const [id] of this.documents) {
      if (id.startsWith(`${roomId}:`)) {
        const fileId = id.split(":")[1];
        if (fileId) {
          promises.push(this.cleanupDocument(roomId, fileId));
        }
      }
    }
    await Promise.all(promises);
  }
}

export const documentService = DocumentService.getInstance();
