import { WhiteboardModel } from "../../modules/whiteboard/whiteboard.model.js";
import { socketLogger } from "../utils/socket.logger.js";
import mongoose from "mongoose";
import { Room } from "../../modules/room/room.model.js";
import { WhiteboardObject } from "@codesync/types";

interface WhiteboardState {
  objects: Record<string, WhiteboardObject>;
  saveTimeout: NodeJS.Timeout | null;
  workspaceId: string;
}

const SAVE_DEBOUNCE_MS = 3000;

export class WhiteboardService {
  private static instance: WhiteboardService;
  private whiteboards = new Map<string, WhiteboardState>();

  private constructor() {}

  public static getInstance(): WhiteboardService {
    if (!WhiteboardService.instance) {
      WhiteboardService.instance = new WhiteboardService();
    }
    return WhiteboardService.instance;
  }

  public async getWhiteboard(roomId: string): Promise<Record<string, WhiteboardObject>> {
    if (this.whiteboards.has(roomId)) {
      return this.whiteboards.get(roomId)!.objects;
    }

    const objects: Record<string, WhiteboardObject> = {};
    let workspaceId = "";

    try {
      const room = await Room.findById(roomId);
      if (!room) throw new Error("Room not found");
      workspaceId = room.workspace.toString();

      const savedWhiteboard = await WhiteboardModel.findOne({ room: roomId });
      if (savedWhiteboard && Array.isArray(savedWhiteboard.objects)) {
        savedWhiteboard.objects.forEach((obj: any) => {
          if (obj && obj.id) {
            objects[obj.id] = obj as WhiteboardObject;
          }
        });
        socketLogger.info(`Loaded whiteboard for room ${roomId} from DB`);
      } else {
        await WhiteboardModel.create({
          workspace: new mongoose.Types.ObjectId(workspaceId),
          room: new mongoose.Types.ObjectId(roomId),
          objects: [],
        });
        socketLogger.info(`Created new whiteboard for room ${roomId} in DB`);
      }
    } catch (error) {
      socketLogger.error(`Error loading whiteboard for room ${roomId}`, { error });
    }

    this.whiteboards.set(roomId, {
      objects,
      saveTimeout: null,
      workspaceId,
    });

    return objects;
  }

  public async applyUpdate(
    roomId: string,
    callback: (objects: Record<string, WhiteboardObject>) => void
  ): Promise<void> {
    let state = this.whiteboards.get(roomId);

    if (!state) {
      await this.getWhiteboard(roomId);
      state = this.whiteboards.get(roomId);
    }

    if (!state) return;

    try {
      callback(state.objects);
      this.scheduleSave(roomId);
    } catch (error) {
      socketLogger.error(`Error applying update to whiteboard in room ${roomId}`, { error });
    }
  }

  private scheduleSave(roomId: string) {
    const state = this.whiteboards.get(roomId);
    if (!state) return;

    if (state.saveTimeout) {
      clearTimeout(state.saveTimeout);
    }

    state.saveTimeout = setTimeout(() => {
      this.saveWhiteboard(roomId).catch((error) => {
        socketLogger.error(`Debounced whiteboard save failed for ${roomId}`, { error });
      });
    }, SAVE_DEBOUNCE_MS);
  }

  public async saveWhiteboard(roomId: string): Promise<void> {
    const state = this.whiteboards.get(roomId);
    if (!state) return;

    try {
      const objectsArray = Object.values(state.objects);
      await WhiteboardModel.findOneAndUpdate(
        { room: roomId },
        {
          objects: objectsArray,
          workspace: new mongoose.Types.ObjectId(state.workspaceId),
        },
        { upsert: true, new: true }
      );
      socketLogger.debug(`Saved whiteboard in room ${roomId} to DB`);
    } catch (error) {
      socketLogger.error(`Error saving whiteboard for room ${roomId}`, { error });
    }
  }

  public async cleanupRoom(roomId: string): Promise<void> {
    const state = this.whiteboards.get(roomId);
    if (!state) return;

    if (state.saveTimeout) {
      clearTimeout(state.saveTimeout);
    }

    await this.saveWhiteboard(roomId);
    this.whiteboards.delete(roomId);
    socketLogger.info(`Cleaned up whiteboard for room ${roomId}`);
  }
}

export const whiteboardService = WhiteboardService.getInstance();
