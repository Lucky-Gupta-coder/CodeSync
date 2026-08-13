import { SocketEvents } from "@codesync/types";
import { CodeSyncSocket } from "../types/socket.types.js";
import { socketLogger } from "../utils/socket.logger.js";
import { handleSocketError } from "../middleware/socket.error.js";
import { chatService } from "../../modules/chat/chat.service.js";
import { ChatMessageSchema } from "@codesync/validators";
import { Room } from "../../modules/room/room.model.js";

export const handleChatEvents = (socket: CodeSyncSocket) => {
  socket.on(SocketEvents.CHAT_SEND_MESSAGE, async (data, callback) => {
    try {
      const { roomId, content } = data;
      if (!roomId) {
        throw new Error("roomId is required");
      }

      const user = socket.data.user;

      // Validate content using Zod schema
      const validatedData = ChatMessageSchema.parse({ content });

      // Retrieve workspaceId from the room to pass to chatService
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      // Create message in DB
      const messageDto = await chatService.createMessage(
        room.workspace.toString(),
        roomId,
        user.id,
        validatedData.content
      );

      // Broadcast to room (including sender)
      socket.nsp.to(roomId).emit(SocketEvents.CHAT_MESSAGE, messageDto);

      socketLogger.info(`Socket ${socket.id} sent message to room ${roomId}`);

      if (callback) {
        callback({ success: true, data: messageDto });
      }
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.CHAT_SEND_MESSAGE);
      if (callback) {
        callback({
          success: false,
          error: {
            code: "CHAT_SEND_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
  });

  socket.on(SocketEvents.CHAT_GET_HISTORY, async (data, callback) => {
    try {
      const { roomId, limit, before } = data;
      if (!roomId) {
        throw new Error("roomId is required");
      }

      const user = socket.data.user;

      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error("Room not found");
      }

      const history = await chatService.getRoomMessages(
        room.workspace.toString(),
        roomId,
        user.id,
        limit,
        before
      );

      if (callback) {
        callback({ success: true, data: history });
      }
    } catch (error) {
      handleSocketError(socket, error, SocketEvents.CHAT_GET_HISTORY);
      if (callback) {
        callback({
          success: false,
          error: {
            code: "CHAT_HISTORY_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
  });
};
