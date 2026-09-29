import "../src/config/env.js";
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/modules/user/user.model.js";

import { setupTestDB, teardownTestDB } from "./setup/test-db.js";

describe("Debug Database Integration Tests", () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await teardownTestDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("GET /api/debug/database", () => {
    it("should return database details, collections, and usersCount", async () => {
      // Create a test user to ensure usersCount is 1
      await User.create({
        name: "Debug User",
        email: "debug@example.com",
        password: "hashedpassword123",
      });

      const res = await request(app).get("/api/debug/database");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("databaseName");
      expect(res.body.databaseName).toBe(mongoose.connection.name);
      expect(res.body).toHaveProperty("collections");
      expect(Array.isArray(res.body.collections)).toBe(true);
      expect(res.body.collections).toContain("users");
      expect(res.body).toHaveProperty("usersCount", 1);
    });

    it("should return 403 Forbidden when NODE_ENV is production", async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      try {
        const res = await request(app).get("/api/debug/database");
        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Debug endpoint is disabled in production");
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });
});
