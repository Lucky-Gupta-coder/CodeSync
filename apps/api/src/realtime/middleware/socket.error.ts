import { SocketError, SocketEvents } from "@codesync/types";
import { socketLogger } from "../utils/socket.logger.js";
import { CodeSyncSocket } from "../types/socket.types.js";

export const handleSocketError = (socket: CodeSyncSocket, error: unknown, context?: string) => {
  const err = error as { message?: string; code?: string };
  socketLogger.error(`Socket Error [${context || "Unknown Context"}]`, {
    error: err?.message || err,
    socketId: socket.id,
    userId: socket.data?.user?.id,
  });

  const errorPayload: SocketError = {
    code: err?.code || "INTERNAL_ERROR",
    message: err?.message || "An unexpected error occurred",
  };

  socket.emit(SocketEvents.ERROR, errorPayload);
};
