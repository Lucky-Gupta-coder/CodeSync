import {
  SocketEvents,
  WhiteboardObjectPayload,
  WhiteboardDeletePayload,
  WhiteboardClearPayload,
  WhiteboardSyncRequestPayload,
} from "@codesync/types";
import { CodeSyncSocket } from "../types/socket.types.js";
import { socketLogger } from "../utils/socket.logger.js";
import { handleSocketError } from "../middleware/socket.error.js";
import { Room } from "../../modules/room/room.model.js";
import { Membership } from "../../modules/workspace/membership.model.js";
import { whiteboardService } from "../services/whiteboard.service.js";

const verifyRoomAccess = async (socket: CodeSyncSocket, roomId: string) => {
  if (!roomId) {
    throw new Error("roomId is required");
  }

  // Verify the socket is actually connected to the room
  if (!socket.rooms.has(roomId)) {
    throw new Error("Socket is not joined to this room");
  }

  const user = socket.data.user;
  const room = await Room.findById(roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  const membership = await Membership.findOne({
    workspace: room.workspace,
    user: user.id,
  });

  if (!membership) {
    throw new Error("You do not have permission to perform actions in this room");
  }
};

export const handleWhiteboardEvents = (socket: CodeSyncSocket) => {
  socket.on(SocketEvents.WHITEBOARD_SYNC_REQUEST, async (data: WhiteboardSyncRequestPayload) => {
    try {
      await verifyRoomAccess(socket, data.roomId);

      const objectsRecord = await whiteboardService.getWhiteboard(data.roomId);
      const objects = Object.values(objectsRecord);

      socketLogger.debug(`Socket ${socket.id} requested sync for room ${data.roomId}`);
      socket.emit(SocketEvents.WHITEBOARD_SYNC_STATE, { roomId: data.roomId, objects });
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.WHITEBOARD_SYNC_REQUEST);
    }
  });

  socket.on(SocketEvents.WHITEBOARD_OBJECT_ADD, async (data: WhiteboardObjectPayload) => {
    try {
      await verifyRoomAccess(socket, data.roomId);

      // Basic validation
      if (!data.object || !data.object.id || !data.object.type) {
        throw new Error("Invalid whiteboard object payload");
      }

      await whiteboardService.applyUpdate(data.roomId, (objects) => {
        objects[data.object.id] = data.object;
      });

      socketLogger.debug(
        `Socket ${socket.id} added object ${data.object.id} to room ${data.roomId}`
      );
      socket.to(data.roomId).emit(SocketEvents.WHITEBOARD_OBJECT_ADD, data);
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.WHITEBOARD_OBJECT_ADD);
    }
  });

  socket.on(SocketEvents.WHITEBOARD_OBJECT_UPDATE, async (data: WhiteboardObjectPayload) => {
    try {
      await verifyRoomAccess(socket, data.roomId);

      if (!data.object || !data.object.id) {
        throw new Error("Invalid whiteboard object payload");
      }

      await whiteboardService.applyUpdate(data.roomId, (objects) => {
        if (objects[data.object.id]) {
          objects[data.object.id] = data.object;
        }
      });

      socketLogger.debug(
        `Socket ${socket.id} updated object ${data.object.id} in room ${data.roomId}`
      );
      socket.to(data.roomId).emit(SocketEvents.WHITEBOARD_OBJECT_UPDATE, data);
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.WHITEBOARD_OBJECT_UPDATE);
    }
  });

  socket.on(SocketEvents.WHITEBOARD_OBJECT_DELETE, async (data: WhiteboardDeletePayload) => {
    try {
      await verifyRoomAccess(socket, data.roomId);

      if (!data.objectId) {
        throw new Error("objectId is required");
      }

      await whiteboardService.applyUpdate(data.roomId, (objects) => {
        delete objects[data.objectId];
      });

      socketLogger.debug(
        `Socket ${socket.id} deleted object ${data.objectId} from room ${data.roomId}`
      );
      socket.to(data.roomId).emit(SocketEvents.WHITEBOARD_OBJECT_DELETE, data);
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.WHITEBOARD_OBJECT_DELETE);
    }
  });

  socket.on(SocketEvents.WHITEBOARD_CLEAR, async (data: WhiteboardClearPayload) => {
    try {
      await verifyRoomAccess(socket, data.roomId);

      await whiteboardService.applyUpdate(data.roomId, (objects) => {
        for (const key of Object.keys(objects)) {
          delete objects[key];
        }
      });

      socketLogger.debug(`Socket ${socket.id} cleared room ${data.roomId}`);
      socket.to(data.roomId).emit(SocketEvents.WHITEBOARD_CLEAR, data);
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.WHITEBOARD_CLEAR);
    }
  });
};
