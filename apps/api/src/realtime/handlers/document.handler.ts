import { SocketEvents } from "@codesync/types";
import { CodeSyncSocket } from "../types/socket.types.js";
import { socketLogger } from "../utils/socket.logger.js";
import { handleSocketError } from "../middleware/socket.error.js";

import * as Y from "yjs";
import { documentService } from "../services/document.service.js";

const MAX_YJS_UPDATE_SIZE = 100 * 1024; // 100KB

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

      // Security: enforce max payload size
      if (update.byteLength > MAX_YJS_UPDATE_SIZE) {
        throw new Error(`Yjs update exceeded maximum allowed size of ${MAX_YJS_UPDATE_SIZE} bytes`);
      }

      // Broadcast to everyone else in the room
      socket.to(roomId).emit(SocketEvents.DOCUMENT_UPDATE, data);

      // Persist the update debounced
      documentService.applyUpdate(roomId, fileId, update).catch((err) => {
        socketLogger.error("Failed to apply update to documentService", { error: err });
      });
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.DOCUMENT_UPDATE);
    }
  });

  // Relay request for full document state
  socket.on(SocketEvents.DOCUMENT_STATE_REQUEST, async (data) => {
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

      // Try fetching from DocumentService (which loads from DB if necessary)
      const doc = await documentService.getDocument(roomId, fileId);
      const encodedState = Y.encodeStateAsUpdate(doc);

      socket.emit(SocketEvents.DOCUMENT_STATE_RESPONSE, {
        roomId,
        fileId,
        state: encodedState.buffer as ArrayBuffer,
      });
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.DOCUMENT_STATE_REQUEST);
    }
  });

  // (Optional) We no longer strictly need clients to send us their state,
  // since the server maintains it. We can either remove DOCUMENT_STATE_RESPONSE listener
  // or leave it as a relay just in case a client wants to sync explicitly with another client.
  // For simplicity, we can keep the relay for backward compatibility or remove it.
  // We'll remove it since the server now acts as the source of truth for new joins.
};
