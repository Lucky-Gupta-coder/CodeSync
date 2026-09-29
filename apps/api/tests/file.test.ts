import "../src/config/env.js";
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/modules/user/user.model.js";
import { Workspace } from "../src/modules/workspace/workspace.model.js";
import { Membership } from "../src/modules/workspace/membership.model.js";
import { Room } from "../src/modules/room/room.model.js";
import { FileNode } from "../src/modules/file/file.model.js";
import { jwtService } from "../src/shared/auth/jwt.service.js";
import { mapToUserDTO } from "../src/modules/user/user.mapper.js";
import { WorkspaceVisibility, MembershipRole, UserRole, FileType } from "@codesync/types";
import { SocketManager } from "../src/realtime/server/socket.manager.js";

import { socketManager } from "../src/realtime/server/socket.manager.js";

import { setupTestDB, teardownTestDB } from "./setup/test-db.js";

describe("File/Project Structure Integration Tests", () => {
  let userToken: string;
  let otherUserToken: string;
  let user: any;
  let otherUser: any;
  let workspace: any;
  let room: any;
  let otherRoom: any;

  beforeAll(async () => {
    await setupTestDB();

    jest.spyOn(socketManager, "getIO").mockReturnValue({
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    } as any);

    user = await User.create({
      name: "File User",
      email: "fileuser@example.com",
      password: "hashedpassword123!",
      role: UserRole.MEMBER,
    });

    otherUser = await User.create({
      name: "Other User",
      email: "otheruser@example.com",
      password: "hashedpassword123!",
      role: UserRole.MEMBER,
    });

    userToken = await jwtService.generateAccessToken(mapToUserDTO(user));
    otherUserToken = await jwtService.generateAccessToken(mapToUserDTO(otherUser));

    workspace = await Workspace.create({
      name: "File Workspace",
      owner: user._id,
      visibility: WorkspaceVisibility.PRIVATE,
    });

    await Membership.create({
      workspace: workspace._id,
      user: user._id,
      role: MembershipRole.OWNER,
    });

    room = await Room.create({
      workspace: workspace._id,
      name: "File Room",
      owner: user._id,
    });

    otherRoom = await Room.create({
      workspace: workspace._id,
      name: "Other Room",
      owner: user._id,
    });
  });

  afterAll(async () => {
    await FileNode.deleteMany({});
    await Room.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});

    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    await FileNode.deleteMany({});
  });

  describe("File Name Validation & Uniqueness", () => {
    it("should reject creating a file with an invalid name containing slashes", async () => {
      const res: any = await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "foo/bar.ts", type: FileType.FILE });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain("Name contains invalid characters");
    });

    it("should reject creating a file with exactly . or ..", async () => {
      let res: any = await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: ".", type: FileType.FOLDER });

      expect(res.status).toBe(400);

      res = await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "..", type: FileType.FOLDER });

      expect(res.status).toBe(400);
    });

    it("should enforce unique names at the root level", async () => {
      await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "index.ts", type: FileType.FILE });

      const res: any = await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "index.ts", type: FileType.FOLDER }); // Different type, same name

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("already exists");
    });

    it("should enforce unique names within the same folder, but allow same names in different folders", async () => {
      const folderRes = await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "src", type: FileType.FOLDER });

      const folderId = folderRes.body.data.id;

      // Create index.ts at root
      await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "index.ts", type: FileType.FILE });

      // Create index.ts inside src/ (should succeed)
      const successRes = await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "index.ts", type: FileType.FILE, parentId: folderId });

      expect(successRes.status).toBe(201);

      // Create index.ts again inside src/ (should fail)
      const failRes = await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "index.ts", type: FileType.FILE, parentId: folderId });

      expect(failRes.status).toBe(409);
    });
  });

  describe("File Depth and Security", () => {
    it("should enforce MAX_FILE_TREE_DEPTH", async () => {
      let currentParentId = null;
      // MAX_NESTING_DEPTH is 10
      for (let i = 0; i < 10; i++) {
        const res: any = await request(app)
          .post(`/api/rooms/${room._id}/files`)
          .set("Authorization", `Bearer ${userToken}`)
          .send({ name: `folder-${i}`, type: FileType.FOLDER, parentId: currentParentId });
        expect(res.status).toBe(201);
        currentParentId = res.body.data.id;
      }

      // 11th level should fail
      const failRes = await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: `folder-11`, type: FileType.FOLDER, parentId: currentParentId });

      expect(failRes.status).toBe(400);
      expect(failRes.body.message).toContain("Maximum folder nesting depth");
    });

    it("should prevent unauthorized users from creating files in a room", async () => {
      const res: any = await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({ name: "hacked.js", type: FileType.FILE });

      expect(res.status).toBe(403);
    });

    it("should prevent unauthorized users from deleting files in a room", async () => {
      const fileRes = await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "test.js", type: FileType.FILE });

      const fileId = fileRes.body.data.id;

      const res: any = await request(app)
        .delete(`/api/rooms/${room._id}/files/${fileId}`)
        .set("Authorization", `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Folder Recursive Deletion", () => {
    it("should delete a folder and all nested descendants", async () => {
      const folderRes = await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "parent", type: FileType.FOLDER });
      const parentId = folderRes.body.data.id;

      const subFolderRes = await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "child", type: FileType.FOLDER, parentId });
      const childId = subFolderRes.body.data.id;

      await request(app)
        .post(`/api/rooms/${room._id}/files`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "grandchild.ts", type: FileType.FILE, parentId: childId });

      let count = await FileNode.countDocuments({ room: room._id });
      expect(count).toBe(3);

      const delRes = await request(app)
        .delete(`/api/rooms/${room._id}/files/${parentId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(delRes.status).toBe(200);

      count = await FileNode.countDocuments({ room: room._id });
      expect(count).toBe(0); // Everything deleted
    });
  });
});
