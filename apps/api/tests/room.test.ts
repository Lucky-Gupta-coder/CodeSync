import "../src/config/env.js";
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/modules/user/user.model.js";
import { Workspace } from "../src/modules/workspace/workspace.model.js";
import { Membership } from "../src/modules/workspace/membership.model.js";
import { Room } from "../src/modules/room/room.model.js";
import { jwtService } from "../src/shared/auth/jwt.service.js";
import { mapToUserDTO } from "../src/modules/user/user.mapper.js";
import {
  WorkspaceVisibility,
  MembershipRole,
  RoomLanguage,
  RoomStatus,
  UserRole,
} from "@codesync/types";

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

describe("Room Integration Tests", () => {
  let ownerToken: string;
  let adminToken: string;
  let editorToken: string;
  let viewerToken: string;

  let owner: any;
  let admin: any;
  let editor: any;
  let viewer: any;

  let workspace: any;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(TEST_MONGO_URI);

    // Create users
    owner = await User.create({
      name: "Owner",
      email: "owner@example.com",
      password: "password123!",
      role: UserRole.MEMBER,
    });
    admin = await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: "password123!",
      role: UserRole.MEMBER,
    });
    editor = await User.create({
      name: "Editor",
      email: "editor@example.com",
      password: "password123!",
      role: UserRole.MEMBER,
    });
    viewer = await User.create({
      name: "Viewer",
      email: "viewer@example.com",
      password: "password123!",
      role: UserRole.MEMBER,
    });

    ownerToken = await jwtService.generateAccessToken(mapToUserDTO(owner));
    adminToken = await jwtService.generateAccessToken(mapToUserDTO(admin));
    editorToken = await jwtService.generateAccessToken(mapToUserDTO(editor));
    viewerToken = await jwtService.generateAccessToken(mapToUserDTO(viewer));
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
    await Room.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
    await Room.deleteMany({});

    // Create test workspace owned by owner
    workspace = await Workspace.create({
      name: "Room Test Workspace",
      owner: owner._id,
      visibility: WorkspaceVisibility.PRIVATE,
    });

    // Create memberships
    await Membership.create([
      { workspace: workspace._id, user: owner._id, role: MembershipRole.OWNER },
      { workspace: workspace._id, user: admin._id, role: MembershipRole.ADMIN },
      { workspace: workspace._id, user: editor._id, role: MembershipRole.EDITOR },
      { workspace: workspace._id, user: viewer._id, role: MembershipRole.VIEWER },
    ]);
  });

  describe("POST /api/workspaces/:workspaceId/rooms", () => {
    it("should allow OWNER and ADMIN to create a room", async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspace._id}/rooms`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Main Room",
          description: "Main workspace room",
          language: RoomLanguage.TYPESCRIPT,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Main Room");
      expect(res.body.data.language).toBe(RoomLanguage.TYPESCRIPT);
      expect(res.body.data.status).toBe(RoomStatus.ACTIVE);
    });

    it("should block EDITOR and VIEWER from creating a room", async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspace._id}/rooms`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({ name: "Editor Room" });

      expect(res.status).toBe(403);
    });

    it("should reject duplicate room names in same workspace", async () => {
      await request(app)
        .post(`/api/workspaces/${workspace._id}/rooms`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Unique Room" });

      const res = await request(app)
        .post(`/api/workspaces/${workspace._id}/rooms`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Unique Room" });

      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/workspaces/:workspaceId/rooms", () => {
    beforeEach(async () => {
      await Room.create([
        { workspace: workspace._id, name: "Room 1", owner: owner._id },
        { workspace: workspace._id, name: "Room 2", owner: owner._id },
      ]);
    });

    it("should allow members with at least VIEWER role to list rooms", async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspace._id}/rooms`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe("GET /api/rooms/:id", () => {
    let room: any;

    beforeEach(async () => {
      room = await Room.create({
        workspace: workspace._id,
        name: "Test Room",
        owner: owner._id,
      });
    });

    it("should allow members with at least VIEWER role to fetch a room by ID", async () => {
      const res = await request(app)
        .get(`/api/rooms/${room._id}`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Test Room");
    });
  });

  describe("PATCH, POST archive/restore, and DELETE rooms", () => {
    let room: any;

    beforeEach(async () => {
      room = await Room.create({
        workspace: workspace._id,
        name: "Actions Room",
        owner: owner._id,
      });
    });

    it("should allow ADMIN to rename and update room details", async () => {
      const res = await request(app)
        .patch(`/api/rooms/${room._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Renamed Room" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Renamed Room");
    });

    it("should allow ADMIN to archive and restore rooms", async () => {
      const archiveRes = await request(app)
        .post(`/api/rooms/${room._id}/archive`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(archiveRes.status).toBe(200);
      expect(archiveRes.body.data.status).toBe(RoomStatus.ARCHIVED);

      const restoreRes = await request(app)
        .post(`/api/rooms/${room._id}/restore`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.data.status).toBe(RoomStatus.ACTIVE);
    });

    it("should allow ADMIN to delete rooms", async () => {
      const res = await request(app)
        .delete(`/api/rooms/${room._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const checkRoom = await Room.findById(room._id);
      expect(checkRoom).toBeNull();
    });

    it("should block EDITOR from managing rooms", async () => {
      const res = await request(app)
        .patch(`/api/rooms/${room._id}`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({ name: "Hacked Room" });

      expect(res.status).toBe(403);
    });

    it("should reject creating rooms in an archived workspace", async () => {
      await Workspace.findByIdAndUpdate(workspace._id, { isArchived: true });

      const res = await request(app)
        .post(`/api/workspaces/${workspace._id}/rooms`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Post-Archival Room" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Cannot create rooms in an archived workspace");
    });

    it("should reject updates to an archived room", async () => {
      await request(app)
        .post(`/api/rooms/${room._id}/archive`)
        .set("Authorization", `Bearer ${adminToken}`);

      const res = await request(app)
        .patch(`/api/rooms/${room._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Renamed Archived Room" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Cannot modify an archived room");
    });
  });
});
