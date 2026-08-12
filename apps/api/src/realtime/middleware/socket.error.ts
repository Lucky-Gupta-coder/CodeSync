import { SocketError, SocketEvents } from "@codesync/types";
import { socketLogger } from "../utils/socket.logger.js";
import { CodeSyncSocket } from "../types/socket.types.js";

export const handleSocketError = (socket: CodeSyncSocket, error: any, context?: string) => {
  socketLogger.error(`Socket Error [${context || "Unknown Context"}]`, {
    error: error?.message || error,
    socketId: socket.id,
    userId: socket.data?.user?.id,
  });

  const errorPayload: SocketError = {
    code: error?.code || "INTERNAL_ERROR",
    message: error?.message || "An unexpected error occurred",
  };

  socket.emit(SocketEvents.ERROR, errorPayload);
};
