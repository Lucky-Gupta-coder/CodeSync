import "../src/config/env.js";
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/modules/user/user.model.js";
import { Workspace } from "../src/modules/workspace/workspace.model.js";
import { Membership } from "../src/modules/workspace/membership.model.js";
import { jwtService } from "../src/shared/auth/jwt.service.js";
import { mapToUserDTO } from "../src/modules/user/user.mapper.js";
import { WorkspaceVisibility, MembershipRole, UserRole } from "@codesync/types";

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

describe("Workspace Integration Tests", () => {
  let user1Token: string;
  let user2Token: string;
  let user1: any;
  let user2: any;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(TEST_MONGO_URI);

    // Create test users
    user1 = await User.create({
      name: "User One",
      email: "user1@example.com",
      password: "hashedpassword123!",
      role: UserRole.MEMBER,
    });
    user2 = await User.create({
      name: "User Two",
      email: "user2@example.com",
      password: "hashedpassword123!",
      role: UserRole.MEMBER,
    });

    user1Token = await jwtService.generateAccessToken(mapToUserDTO(user1));
    user2Token = await jwtService.generateAccessToken(mapToUserDTO(user2));
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Workspace.deleteMany({});
    await Membership.deleteMany({});
  });

  describe("POST /api/workspaces", () => {
    it("should successfully create a private workspace and assign OWNER membership", async () => {
      const res = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "My Private Workspace",
          description: "Private test workspace",
          visibility: WorkspaceVisibility.PRIVATE,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("My Private Workspace");
      expect(res.body.data.visibility).toBe(WorkspaceVisibility.PRIVATE);
      expect(res.body.data.owner).toBe(String(user1._id));

      // Verify membership record is created
      const membership = await Membership.findOne({
        workspace: res.body.data.id,
        user: user1._id,
      });
      expect(membership).not.toBeNull();
      expect(membership!.role).toBe(MembershipRole.OWNER);
    });

    it("should reject duplicate workspace names for same owner", async () => {
      await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Duplicate Workspace" });

      const res = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Duplicate Workspace" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("A workspace with this name already exists");
    });
  });

  describe("GET /api/workspaces/:id", () => {
    it("should block non-members from accessing a private workspace", async () => {
      const createRes = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Private Workspace 2",
          visibility: WorkspaceVisibility.PRIVATE,
        });

      const res = await request(app)
        .get(`/api/workspaces/${createRes.body.data.id}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Permission denied");
    });

    it("should allow any logged-in user to access a public workspace", async () => {
      const createRes = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Public Workspace",
          visibility: WorkspaceVisibility.PUBLIC,
        });

      const res = await request(app)
        .get(`/api/workspaces/${createRes.body.data.id}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Public Workspace");
    });
  });

  describe("PATCH /api/workspaces/:id", () => {
    it("should allow the owner to update the workspace details", async () => {
      const createRes = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Old Workspace Name" });

      const res = await request(app)
        .patch(`/api/workspaces/${createRes.body.data.id}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "New Workspace Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("New Workspace Name");
    });

    it("should block non-owners from updating the workspace", async () => {
      const createRes = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Workspace" });

      const res = await request(app)
        .patch(`/api/workspaces/${createRes.body.data.id}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ name: "Hack Name" });

      expect(res.status).toBe(403);
    });

    it("should reject updates to an archived workspace", async () => {
      const createRes = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "To Archive Workspace" });

      await request(app)
        .post(`/api/workspaces/${createRes.body.data.id}/archive`)
        .set("Authorization", `Bearer ${user1Token}`);

      const res = await request(app)
        .patch(`/api/workspaces/${createRes.body.data.id}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Renamed Archived Workspace" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Cannot modify an archived workspace");
    });
  });

  describe("POST /api/workspaces/:id/archive and restore", () => {
    it("should allow the owner to archive and restore the workspace", async () => {
      const createRes = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Archive Workspace" });

      const archiveRes = await request(app)
        .post(`/api/workspaces/${createRes.body.data.id}/archive`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(archiveRes.status).toBe(200);
      expect(archiveRes.body.data.isArchived).toBe(true);

      const restoreRes = await request(app)
        .post(`/api/workspaces/${createRes.body.data.id}/restore`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.data.isArchived).toBe(false);
    });
  });

  describe("DELETE /api/workspaces/:id", () => {
    it("should allow owner to delete and cascade delete memberships", async () => {
      const createRes = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Delete Workspace" });

      const workspaceId = createRes.body.data.id;

      // Ensure membership exists
      let membership = await Membership.findOne({ workspace: workspaceId });
      expect(membership).not.toBeNull();

      const deleteRes = await request(app)
        .delete(`/api/workspaces/${workspaceId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(deleteRes.status).toBe(200);

      // Verify workspace is deleted
      const checkWorkspace = await Workspace.findById(workspaceId);
      expect(checkWorkspace).toBeNull();

      // Verify membership is cascade deleted
      membership = await Membership.findOne({ workspace: workspaceId });
      expect(membership).toBeNull();
    });
  });

  describe("GET /api/workspaces (Pagination & Search)", () => {
    beforeEach(async () => {
      // Create multiple workspaces
      await Workspace.create([
        { name: "Alpha", owner: user1._id, visibility: WorkspaceVisibility.PRIVATE },
        { name: "Beta", owner: user1._id, visibility: WorkspaceVisibility.PRIVATE },
        { name: "Gamma", owner: user2._id, visibility: WorkspaceVisibility.PUBLIC },
      ]);
    });

    it("should paginate user workspaces list", async () => {
      const res = await request(app)
        .get("/api/workspaces?page=1&limit=1")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.pagination.pages).toBe(2);
    });

    it("should search workspaces by term", async () => {
      const res = await request(app)
        .get("/api/workspaces?search=Alpha")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe("Alpha");
    });
  });
});
