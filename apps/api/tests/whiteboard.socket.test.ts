import "../src/config/env.js";
import mongoose from "mongoose";
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
  MembershipRole,
} from "@codesync/types";
import { User } from "../src/modules/user/user.model.js";
import { Workspace } from "../src/modules/workspace/workspace.model.js";
import { Membership } from "../src/modules/workspace/membership.model.js";
import { Room } from "../src/modules/room/room.model.js";

import { setupTestDB, teardownTestDB } from "./setup/test-db.js";

describe("Whiteboard Socket Integration Tests", () => {
  let io: Server;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;
  let port: number;

  let owner: any;
  let workspace: any;
  let room: any;
  let token1: string;
  let token2: string;

  beforeAll((done) => {
    setupTestDB().then(() => {
      const httpServer = createServer();
      socketManager.initialize(httpServer);
      io = socketManager.getIO();
      httpServer.listen(() => {
        port = (httpServer.address() as any).port;
        done();
      });
    });
  });

  afterAll(async () => {
    io.close();
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
    await Room.deleteMany({});
    await teardownTestDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
    await Room.deleteMany({});

    owner = await User.create({
      name: "Owner",
      email: "owner@example.com",
      password: "password123!",
      role: UserRole.MEMBER,
    });

    const user2 = await User.create({
      name: "User2",
      email: "user2@example.com",
      password: "password123!",
      role: UserRole.MEMBER,
    });

    workspace = await Workspace.create({
      name: "Test Workspace",
      owner: owner._id,
      visibility: WorkspaceVisibility.PRIVATE,
    });

    await Membership.create([
      { workspace: workspace._id, user: owner._id, role: MembershipRole.OWNER },
      { workspace: workspace._id, user: user2._id, role: MembershipRole.VIEWER },
    ]);

    room = await Room.create({
      workspace: workspace._id,
      name: "Test Room",
      owner: owner._id,
      language: RoomLanguage.TYPESCRIPT,
      status: RoomStatus.ACTIVE,
    });

    token1 = await jwtService.generateAccessToken({
      id: owner.id,
      name: owner.name,
      email: owner.email,
      role: owner.role,
    });
    token2 = await jwtService.generateAccessToken({
      id: user2.id,
      name: user2.name,
      email: user2.email,
      role: user2.role,
    });
  });

  afterEach(() => {
    if (clientSocket1 && clientSocket1.connected) clientSocket1.disconnect();
    if (clientSocket2 && clientSocket2.connected) clientSocket2.disconnect();
  });

  it("should broadcast whiteboard objects to the room", (done) => {
    clientSocket1 = Client(`http://localhost:${port}`, { auth: { token: token1 } });
    clientSocket2 = Client(`http://localhost:${port}`, { auth: { token: token2 } });

    let connections = 0;
    const checkConnections = () => {
      connections++;
      if (connections === 2) {
        // Both connected, join room
        clientSocket1.emit(SocketEvents.JOIN_ROOM, { roomId: room.id }, () => {
          clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomId: room.id }, () => {
            // Both joined room
            clientSocket2.on(SocketEvents.WHITEBOARD_OBJECT_ADD, (data) => {
              expect(data.roomId).toBe(room.id);
              expect(data.object.id).toBe("test-obj-1");
              expect(data.object.type).toBe("DRAWING");
              done();
            });

            clientSocket1.emit(SocketEvents.WHITEBOARD_OBJECT_ADD, {
              roomId: room.id,
              object: {
                id: "test-obj-1",
                type: "DRAWING",
                x: 0,
                y: 0,
                color: "#000",
                strokeWidth: 3,
                points: [{ x: 0, y: 0 }],
              },
            });
          });
        });
      }
    };

    clientSocket1.on(SocketEvents.AUTHENTICATED, checkConnections);
    clientSocket2.on(SocketEvents.AUTHENTICATED, checkConnections);
  });

  it("should return whiteboard sync state on request", (done) => {
    clientSocket1 = Client(`http://localhost:${port}`, { auth: { token: token1 } });

    clientSocket1.on(SocketEvents.AUTHENTICATED, () => {
      clientSocket1.emit(SocketEvents.JOIN_ROOM, { roomId: room.id }, () => {
        clientSocket1.on(SocketEvents.WHITEBOARD_SYNC_STATE, (data) => {
          expect(data.roomId).toBe(room.id);
          expect(Array.isArray(data.objects)).toBe(true);
          done();
        });

        clientSocket1.emit(SocketEvents.WHITEBOARD_SYNC_REQUEST, { roomId: room.id });
      });
    });
  });
});
