import "../src/config/env.js";
import { Server } from "socket.io";
import { createServer } from "http";
import Client, { Socket as ClientSocket } from "socket.io-client";
import { socketManager } from "../src/realtime/server/socket.manager.js";
import { jwtService } from "../src/shared/auth/jwt.service.js";
import {
  SocketEvents,
  UserRole,
  WorkspaceVisibility,
  RoomLanguage,
  RoomStatus,
} from "@codesync/types";
import mongoose from "mongoose";
import { User } from "../src/modules/user/user.model.js";
import { Workspace } from "../src/modules/workspace/workspace.model.js";
import { Membership } from "../src/modules/workspace/membership.model.js";
import { Room } from "../src/modules/room/room.model.js";
import { Message } from "../src/modules/chat/message.model.js";
import { mapToUserDTO } from "../src/modules/user/user.mapper.js";

const baseMongoUri = process.env.MONGO_URI;
if (!baseMongoUri) {
  throw new Error("MONGO_URI environment variable is required for tests but was not resolved.");
}

const parsedUri = new URL(baseMongoUri);
if (parsedUri.pathname === "/" || !parsedUri.pathname) {
  parsedUri.pathname = "/codesync_test";
} else {
  parsedUri.pathname = parsedUri.pathname + "_test";
}
const TEST_MONGO_URI = parsedUri.toString();

describe("Chat Integration Tests", () => {
  let io: Server;
  let clientSocket1: ClientSocket; // Member
  let clientSocket2: ClientSocket; // Non-member
  let port: number;

  let owner: any;
  let nonMember: any;
  let workspace: any;
  let room: any;
  let ownerToken: string;
  let nonMemberToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(TEST_MONGO_URI);

    owner = await User.create({
      name: "Owner",
      email: "owner@example.com",
      password: "password123!",
      role: UserRole.MEMBER,
    });

    nonMember = await User.create({
      name: "NonMember",
      email: "nonmember@example.com",
      password: "password123!",
      role: UserRole.MEMBER,
    });

    ownerToken = await jwtService.generateAccessToken(mapToUserDTO(owner));
    nonMemberToken = await jwtService.generateAccessToken(mapToUserDTO(nonMember));

    workspace = await Workspace.create({
      name: "Chat Test Workspace",
      owner: owner._id,
      visibility: WorkspaceVisibility.PRIVATE,
    });

    await Membership.create({
      workspace: workspace._id,
      user: owner._id,
      role: "OWNER",
    });

    room = await Room.create({
      workspace: workspace._id,
      name: "Chat Room",
      owner: owner._id,
      language: RoomLanguage.JAVASCRIPT,
      status: RoomStatus.ACTIVE,
    });

    const httpServer = createServer();
    socketManager.initialize(httpServer);
    io = socketManager.getIO();

    await new Promise<void>((resolve) => {
      httpServer.listen(() => {
        port = (httpServer.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    io.close();
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
    await Room.deleteMany({});
    await Message.deleteMany({});
    await mongoose.disconnect();
  });

  afterEach(() => {
    if (clientSocket1 && clientSocket1.connected) {
      clientSocket1.disconnect();
    }
    if (clientSocket2 && clientSocket2.connected) {
      clientSocket2.disconnect();
    }
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    await Message.deleteMany({});
  });

  it("should send a chat message and persist it", async () => {
    clientSocket1 = Client(`http://localhost:${port}`, { auth: { token: ownerToken } });

    await new Promise<void>((resolve) => {
      clientSocket1.on("connect", () => {
        clientSocket1.emit(
          SocketEvents.CHAT_SEND_MESSAGE,
          { roomId: room._id.toString(), content: "Hello World!" },
          (response: any) => {
            expect(response.success).toBe(true);
            expect(response.data.content).toBe("Hello World!");
            expect(response.data.sender.name).toBe("Owner");
            resolve();
          }
        );
      });
    });

    const msgs = await Message.find({});
    expect(msgs.length).toBe(1);
    expect(msgs[0].content).toBe("Hello World!");
  });

  it("should reject an empty chat message", async () => {
    clientSocket1 = Client(`http://localhost:${port}`, { auth: { token: ownerToken } });

    await new Promise<void>((resolve) => {
      clientSocket1.on("connect", () => {
        clientSocket1.emit(
          SocketEvents.CHAT_SEND_MESSAGE,
          { roomId: room._id.toString(), content: "   " },
          (response: any) => {
            expect(response.success).toBe(false);
            expect(response.error.code).toBe("CHAT_SEND_ERROR");
            resolve();
          }
        );
      });
    });
  });

  it("should reject non-member from sending messages", async () => {
    clientSocket2 = Client(`http://localhost:${port}`, { auth: { token: nonMemberToken } });

    await new Promise<void>((resolve) => {
      clientSocket2.on("connect", () => {
        clientSocket2.emit(
          SocketEvents.CHAT_SEND_MESSAGE,
          { roomId: room._id.toString(), content: "Hacker text" },
          (response: any) => {
            expect(response.success).toBe(false);
            expect(response.error.code).toBe("CHAT_SEND_ERROR");
            resolve();
          }
        );
      });
    });
  });

  it("should fetch chat history correctly with pagination", async () => {
    // Create 3 messages
    await Message.create([
      { workspace: workspace._id, room: room._id, sender: owner._id, content: "Msg 1" },
      { workspace: workspace._id, room: room._id, sender: owner._id, content: "Msg 2" },
      { workspace: workspace._id, room: room._id, sender: owner._id, content: "Msg 3" },
    ]);

    clientSocket1 = Client(`http://localhost:${port}`, { auth: { token: ownerToken } });

    await new Promise<void>((resolve) => {
      clientSocket1.on("connect", () => {
        clientSocket1.emit(
          SocketEvents.CHAT_GET_HISTORY,
          { roomId: room._id.toString(), limit: 2 },
          (response: any) => {
            expect(response.success).toBe(true);
            expect(response.data.messages.length).toBe(2);
            expect(response.data.hasMore).toBe(true);
            expect(response.data.messages[0].content).toBe("Msg 2"); // returned oldest to newest in batch
            expect(response.data.messages[1].content).toBe("Msg 3");
            resolve();
          }
        );
      });
    });
  });

  it("should reject non-member from fetching history", async () => {
    clientSocket2 = Client(`http://localhost:${port}`, { auth: { token: nonMemberToken } });

    await new Promise<void>((resolve) => {
      clientSocket2.on("connect", () => {
        clientSocket2.emit(
          SocketEvents.CHAT_GET_HISTORY,
          { roomId: room._id.toString(), limit: 50 },
          (response: any) => {
            expect(response.success).toBe(false);
            expect(response.error.code).toBe("CHAT_HISTORY_ERROR");
            resolve();
          }
        );
      });
    });
  });

  it("should broadcast CHAT_MESSAGE to the room when sending", async () => {
    clientSocket1 = Client(`http://localhost:${port}`, { auth: { token: ownerToken } });
    clientSocket2 = Client(`http://localhost:${port}`, { auth: { token: ownerToken } });

    await new Promise<void>((resolve) => {
      let joined = 0;
      const joinDone = () => {
        joined++;
        if (joined === 2) {
          // Both joined, now send message
          clientSocket1.emit(SocketEvents.CHAT_SEND_MESSAGE, {
            roomId: room._id.toString(),
            content: "Broadcast this",
          });
        }
      };

      clientSocket2.on(SocketEvents.CHAT_MESSAGE, (data) => {
        expect(data.content).toBe("Broadcast this");
        expect(data.roomId).toBe(room._id.toString());
        resolve();
      });

      clientSocket1.on("connect", () => {
        clientSocket1.emit(SocketEvents.JOIN_ROOM, { roomId: room._id.toString() }, joinDone);
      });

      clientSocket2.on("connect", () => {
        clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomId: room._id.toString() }, joinDone);
      });
    });
  });
});
