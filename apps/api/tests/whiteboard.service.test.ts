import "../src/config/env.js";
import mongoose from "mongoose";
import { WhiteboardService } from "../src/realtime/services/whiteboard.service.js";
import { Room } from "../src/modules/room/room.model.js";
import { Workspace } from "../src/modules/workspace/workspace.model.js";
import { UserRole, WorkspaceVisibility, RoomLanguage, RoomStatus } from "@codesync/types";
import { User } from "../src/modules/user/user.model.js";

import { setupTestDB, teardownTestDB } from "./setup/test-db.js";

describe("WhiteboardService Integration Tests", () => {
  let whiteboardService: WhiteboardService;
  let owner: any;
  let workspace: any;
  let room: any;

  beforeAll(async () => {
    await setupTestDB();
    whiteboardService = WhiteboardService.getInstance();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Room.deleteMany({});
    await teardownTestDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Room.deleteMany({});

    owner = await User.create({
      name: "Owner",
      email: "owner@example.com",
      password: "password123!",
      role: UserRole.MEMBER,
    });

    workspace = await Workspace.create({
      name: "Test Workspace",
      owner: owner._id,
      visibility: WorkspaceVisibility.PRIVATE,
    });

    room = await Room.create({
      workspace: workspace._id,
      name: "Test Room",
      owner: owner._id,
      language: RoomLanguage.TYPESCRIPT,
      status: RoomStatus.ACTIVE,
    });
  });

  it("should create a new whiteboard if it does not exist", async () => {
    const state = await whiteboardService.getWhiteboard(room.id);
    expect(state).toBeDefined();
    expect(Object.keys(state).length).toBe(0);
  });

  it("should save and load whiteboard objects", async () => {
    await whiteboardService.applyUpdate(room.id, (objects) => {
      objects["test-obj"] = {
        id: "test-obj",
        type: "DRAWING",
        x: 0,
        y: 0,
        color: "#000",
        strokeWidth: 3,
        points: [],
      };
    });

    // Force save
    await whiteboardService.saveWhiteboard(room.id);

    // Clean up memory
    await whiteboardService.cleanupRoom(room.id);

    // Load from DB
    const state = await whiteboardService.getWhiteboard(room.id);
    expect(state["test-obj"]).toBeDefined();
    expect(state["test-obj"].id).toBe("test-obj");
  });
});
