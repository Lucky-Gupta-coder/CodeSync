import { SocketEvents, CursorUpdate } from "@codesync/types";
import { CodeSyncSocket } from "../types/socket.types.js";
import { handleSocketError } from "../middleware/socket.error.js";

export const handlePresenceEvents = (socket: CodeSyncSocket) => {
  socket.on(SocketEvents.CURSOR_UPDATE, (data: CursorUpdate) => {
    try {
      const { roomId, position } = data;

      if (!roomId) {
        throw new Error("roomId is required for cursor update");
      }

      // Verify the user is authenticated
      const user = socket.data.user;
      if (!user) return;

      // Verify socket is actually in the room
      if (!socket.rooms.has(roomId)) {
        return;
      }

      // Broadcast to other users in the room
      // Force the userId to be the authenticated user's ID
      const broadcastData: CursorUpdate = {
        roomId,
        userId: user.id,
        position,
      };

      socket.to(roomId).emit(SocketEvents.CURSOR_UPDATE, broadcastData);
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.CURSOR_UPDATE);
    }
  });
};
