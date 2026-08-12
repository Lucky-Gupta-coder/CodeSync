import { SocketEvents } from "@codesync/types";
import { CodeSyncSocket } from "../types/socket.types.js";
import { socketLogger } from "../utils/socket.logger.js";
import { handleSocketError } from "../middleware/socket.error.js";
import { presenceService } from "../services/presence.service.js";
import { Room } from "../../modules/room/room.model.js";
import { Membership } from "../../modules/workspace/membership.model.js";
import { documentService } from "../services/document.service.js";

export const handleRoomEvents = (socket: CodeSyncSocket) => {
  socket.on(SocketEvents.JOIN_ROOM, async (data, callback) => {
    try {
      const { roomId } = data;
      if (!roomId) {
        throw new Error("roomId is required");
      }

      const user = socket.data.user;

      // 1. Verify Room exists
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      // 2. Verify Membership exists for the room's workspace
      const membership = await Membership.findOne({
        workspace: room.workspace,
        user: user.id,
      });

      if (!membership) {
        throw new Error("You do not have permission to join this room");
      }

      await socket.join(roomId);
      socketLogger.info(`Socket ${socket.id} joined room ${roomId}`);

      const roomUsers = presenceService.joinRoom(roomId, socket.id, user);

      // Notify others in the room
      socket.to(roomId).emit(SocketEvents.ROOM_JOINED, {
        roomId,
        members: [user],
      });

      // Emit presence update to everyone in the room (including the sender, so they get the full list)
      socket.emit(SocketEvents.PRESENCE_UPDATE, { roomId, users: roomUsers });
      socket.to(roomId).emit(SocketEvents.PRESENCE_UPDATE, { roomId, users: roomUsers });

      if (callback) {
        callback({ success: true, data: { roomId } });
      }
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.JOIN_ROOM);
      if (callback) {
        callback({
          success: false,
          error: {
            code: "JOIN_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
  });

  socket.on(SocketEvents.LEAVE_ROOM, async (data, callback) => {
    try {
      const { roomId } = data;
      if (!roomId) {
        throw new Error("roomId is required");
      }

      await socket.leave(roomId);
      socketLogger.info(`Socket ${socket.id} left room ${roomId}`);

      const roomUsers = presenceService.leaveRoom(roomId, socket.id);

      // Notify others in the room
      socket.to(roomId).emit(SocketEvents.ROOM_LEFT, {
        roomId,
        userId: socket.data.user.id,
      });

      if (roomUsers !== null) {
        // Emit presence update
        socket.to(roomId).emit(SocketEvents.PRESENCE_UPDATE, { roomId, users: roomUsers });
        // The sender also might want to know they left if we send it back
        socket.emit(SocketEvents.PRESENCE_UPDATE, { roomId, users: roomUsers });

        // If the room is now empty, clean up documents
        if (roomUsers.length === 0) {
          documentService.cleanupRoom(roomId).catch((err) => {
            socketLogger.error(`Error cleaning up room ${roomId} documents`, { error: err });
          });
        }
      }

      if (callback) {
        callback({ success: true, data: { roomId } });
      }
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.LEAVE_ROOM);
      if (callback) {
        callback({
          success: false,
          error: {
            code: "LEAVE_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
  });
};
