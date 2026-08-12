import { SocketEvents } from "@codesync/types";
import { CodeSyncSocket } from "../types/socket.types.js";
import { presenceService } from "../services/presence.service.js";
import { socketLogger } from "../utils/socket.logger.js";

export const handleConnection = (socket: CodeSyncSocket) => {
  const user = socket.data.user;

  // Track user presence
  presenceService.addConnection(socket.id, user);

  socketLogger.info(`Client connected: ${user.name} (${user.email}) [Socket ID: ${socket.id}]`);

  // Send an authenticated event back to client
  socket.emit(SocketEvents.AUTHENTICATED);

  // Handle generic ping for heartbeat/latency checking
  socket.on(SocketEvents.PING, () => {
    socket.emit(SocketEvents.PONG);
  });

  socket.on(SocketEvents.DISCONNECT, (reason) => {
    socketLogger.info(
      `Client disconnected: ${user.name} [Socket ID: ${socket.id}] - Reason: ${reason}`
    );
    const affectedRooms = presenceService.removeConnection(socket.id);

    for (const roomId of affectedRooms) {
      const users = presenceService.getRoomUsers(roomId);
      socket.to(roomId).emit(SocketEvents.PRESENCE_UPDATE, {
        roomId,
        users,
      });
    }
  });
};
