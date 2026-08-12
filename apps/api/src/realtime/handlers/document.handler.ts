import { SocketEvents } from "@codesync/types";
import { CodeSyncSocket } from "../types/socket.types.js";
import { socketLogger } from "../utils/socket.logger.js";
import { handleSocketError } from "../middleware/socket.error.js";

export const handleDocumentEvents = (socket: CodeSyncSocket) => {
  // Relay document updates (binary Yjs updates) to all other clients in the room
  socket.on(SocketEvents.DOCUMENT_UPDATE, (data) => {
    try {
      const { roomId, fileId, update } = data;
      if (!roomId || !fileId || !update) {
        throw new Error("roomId, fileId, and update are required for DOCUMENT_UPDATE");
      }

      // Security: ensure the socket is actually in the room
      if (!socket.rooms.has(roomId)) {
        throw new Error(
          `Socket ${socket.id} attempted to send update to room ${roomId} without joining`
        );
      }

      // Broadcast to everyone else in the room
      socket.to(roomId).emit(SocketEvents.DOCUMENT_UPDATE, data);
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.DOCUMENT_UPDATE);
    }
  });

  // Relay request for full document state
  socket.on(SocketEvents.DOCUMENT_STATE_REQUEST, (data) => {
    try {
      const { roomId, fileId } = data;
      if (!roomId || !fileId) {
        throw new Error("roomId and fileId are required for DOCUMENT_STATE_REQUEST");
      }

      if (!socket.rooms.has(roomId)) {
        throw new Error(
          `Socket ${socket.id} attempted to request state from room ${roomId} without joining`
        );
      }

      socketLogger.debug(`Socket ${socket.id} requesting state for ${fileId} in room ${roomId}`);

      // Broadcast request to everyone else in the room
      socket.to(roomId).emit(SocketEvents.DOCUMENT_STATE_REQUEST, {
        ...data,
        requesterId: socket.id,
      });
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.DOCUMENT_STATE_REQUEST);
    }
  });

  // Relay the response containing the full document state back to the requester
  socket.on(SocketEvents.DOCUMENT_STATE_RESPONSE, (data) => {
    try {
      const { roomId, fileId, state, targetSocketId } = data;
      if (!roomId || !fileId || !state || !targetSocketId) {
        throw new Error(
          "roomId, fileId, state, and targetSocketId are required for DOCUMENT_STATE_RESPONSE"
        );
      }

      if (!socket.rooms.has(roomId)) {
        throw new Error(
          `Socket ${socket.id} attempted to send state response to room ${roomId} without joining`
        );
      }

      // Send the state directly to the socket that requested it
      socket.to(targetSocketId).emit(SocketEvents.DOCUMENT_STATE_RESPONSE, {
        roomId,
        fileId,
        state,
      });
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.DOCUMENT_STATE_RESPONSE);
    }
  });
};
