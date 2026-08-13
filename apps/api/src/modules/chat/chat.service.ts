import mongoose from "mongoose";
import { Message } from "./message.model.js";
import { Room } from "../room/room.model.js";
import { Membership } from "../workspace/membership.model.js";
import { IUser } from "../user/user.model.js";
import { ChatMessageDTO, ChatHistoryResponse } from "@codesync/types";
import { NotFoundError } from "../../shared/errors/not-found-error.js";
import { ForbiddenError } from "../../shared/errors/forbidden-error.js";
import { IMessage } from "./message.model.js";

export class ChatService {
  /**
   * Creates a new chat message after validating permissions.
   */
  async createMessage(
    workspaceId: string,
    roomId: string,
    senderId: string,
    content: string
  ): Promise<ChatMessageDTO> {
    // 1. Verify Room exists and belongs to the workspace
    const room = await Room.findOne({ _id: roomId, workspace: workspaceId });
    if (!room) {
      throw new NotFoundError("Room not found or does not belong to this workspace");
    }

    // 2. Verify Membership exists for the room's workspace
    const membership = await Membership.findOne({
      workspace: workspaceId,
      user: senderId,
    });

    if (!membership) {
      throw new ForbiddenError("You do not have permission to send messages in this room");
    }

    // 3. Create the message
    const message = new Message({
      workspace: workspaceId,
      room: roomId,
      sender: senderId,
      content,
    });

    await message.save();

    // 4. Populate sender details for DTO
    const populatedMessage = await message.populate("sender", "name avatar");

    const senderDoc = populatedMessage.sender as unknown as IUser;

    return {
      id: populatedMessage.id,
      roomId: populatedMessage.room.toString(),
      sender: {
        id: senderDoc._id.toString(),
        name: senderDoc.name,
        avatar: senderDoc.avatar,
      },
      content: populatedMessage.content,
      createdAt: populatedMessage.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves paginated chat history for a room.
   */
  async getRoomMessages(
    workspaceId: string,
    roomId: string,
    userId: string,
    limit: number = 50,
    before?: string
  ): Promise<ChatHistoryResponse> {
    // 1. Verify Room exists and belongs to the workspace
    const room = await Room.findOne({ _id: roomId, workspace: workspaceId });
    if (!room) {
      throw new NotFoundError("Room not found or does not belong to this workspace");
    }

    // 2. Verify Membership exists for the room's workspace
    const membership = await Membership.findOne({
      workspace: workspaceId,
      user: userId,
    });

    if (!membership) {
      throw new ForbiddenError("You do not have permission to view messages in this room");
    }

    // 3. Build query
    const query: mongoose.FilterQuery<IMessage> = {
      workspace: workspaceId,
      room: roomId,
    };

    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        query.createdAt = { $lt: beforeDate };
      }
    }

    const safeLimit = Math.min(Math.max(1, limit), 100); // Between 1 and 100

    // 4. Fetch messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(safeLimit + 1) // Fetch one extra to check if there are more
      .populate("sender", "name avatar")
      .exec();

    const hasMore = messages.length > safeLimit;
    const resultsToReturn = hasMore ? messages.slice(0, safeLimit) : messages;

    // Convert to DTO and reverse to return chronological order for the client (oldest to newest within the page)
    const dtos: ChatMessageDTO[] = resultsToReturn
      .map((msg) => {
        const senderDoc = msg.sender as unknown as IUser;
        return {
          id: msg.id,
          roomId: msg.room.toString(),
          sender: {
            id: senderDoc._id.toString(),
            name: senderDoc.name,
            avatar: senderDoc.avatar,
          },
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
        };
      })
      .reverse();

    return {
      roomId,
      messages: dtos,
      hasMore,
    };
  }
}

export const chatService = new ChatService();
