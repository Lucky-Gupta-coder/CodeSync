import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/modules/user/user.model.js";
import argon2 from "argon2";
import * as jose from "jose";
import { jwtConfig } from "../src/config/jwt.js";
import { UserRole } from "@codesync/types";

const TEST_MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/codesync_test";

describe("Auth Integration Tests", () => {
  beforeAll(async () => {
    // Re-connect to test database to avoid polluting main data
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(TEST_MONGO_URI);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    it("should successfully register a user and return sanitized User DTO", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "SecurePassword123!",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Account created successfully");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.name).toBe("Test User");
      expect(res.body.data.email).toBe("test@example.com");
      expect(res.body.data.role).toBe(UserRole.MEMBER);
      expect(res.body.data.passwordHash).toBeUndefined();

      // Verify user is stored in DB
      const dbUser = await User.findOne({ email: "test@example.com" }).select("+passwordHash");
      expect(dbUser).not.toBeNull();
      expect(dbUser!.name).toBe("Test User");

      // Verify it is a valid Argon2 hash
      expect(dbUser!.passwordHash).not.toBe("SecurePassword123!");
      const isPasswordValid = await argon2.verify(dbUser!.passwordHash, "SecurePassword123!");
      expect(isPasswordValid).toBe(true);
    });

    it("should reject duplicate email with 409 Conflict", async () => {
      const passwordHash = await argon2.hash("SecurePassword123!");
      await User.create({
        name: "Existing User",
        email: "duplicate@example.com",
        passwordHash,
      });

      const res = await request(app).post("/api/auth/register").send({
        name: "Another User",
        email: "duplicate@example.com",
        password: "SecurePassword123!",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Email already exists");
    });

    it("should reject invalid email format with 400 Bad Request", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "invalid-email",
        password: "SecurePassword123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Validation Error");
      expect(res.body.errors[0].path).toBe("email");
    });

    it("should reject weak password complexity with 400 Bad Request", async () => {
      // Missing uppercase
      let res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "weak1@example.com",
        password: "weakpassword123!",
      });
      expect(res.status).toBe(400);

      // Missing special character
      res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "weak2@example.com",
        password: "WeakPassword123",
      });
      expect(res.status).toBe(400);

      // Too short (less than 8 chars)
      res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "weak3@example.com",
        password: "W123!",
      });
      expect(res.status).toBe(400);
    });

    it("should reject missing fields with 400 Bad Request", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Validation Error");
    });
  });

  describe("POST /api/auth/login and GET /api/auth/me", () => {
    let testUser: any;
    const testPassword = "SecurePassword123!";

    beforeEach(async () => {
      const passwordHash = await argon2.hash(testPassword);
      testUser = await User.create({
        name: "Login User",
        email: "login@example.com",
        passwordHash,
        lastLogin: null,
      });
    });

    it("should successfully log in, return access token and DTO, and update lastLogin", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.body.data.user.name).toBe("Login User");
      expect(res.body.data.user.email).toBe("login@example.com");
      expect(res.body.data.user.role).toBe(UserRole.MEMBER);
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // Check database to ensure lastLogin was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser!.lastLogin).not.toBeNull();
      expect(updatedUser!.lastLogin).toBeInstanceOf(Date);
    });

    it("should reject login with non-existent email (401)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "missing@example.com",
        password: testPassword,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("should reject login with incorrect password (401)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: "WrongPassword1!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("should succeed GET /api/auth/me when authenticated with Bearer token", async () => {
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: testPassword,
      });

      const token = loginRes.body.data.accessToken;

      const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Login User");
      expect(res.body.data.email).toBe("login@example.com");
      expect(res.body.data.role).toBe(UserRole.MEMBER);
    });

    it("should reject GET /api/auth/me when authorization header is missing (401)", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Authentication token is required");
    });

    it("should reject GET /api/auth/me when authorization header is malformed (401)", async () => {
      const res = await request(app).get("/api/auth/me").set("Authorization", "Basic abc");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        "Malformed authentication header. Format must be: Bearer <token>"
      );
    });

    it("should reject GET /api/auth/me when token is invalid (401)", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalidtoken");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid or expired authentication token");
    });

    it("should reject GET /api/auth/me when token has expired (401)", async () => {
      const secret = new TextEncoder().encode(jwtConfig.accessSecret);

      // Create an expired token manually using jose with correct standard claims
      const expiredToken = await new jose.SignJWT({
        email: "login@example.com",
        role: UserRole.MEMBER,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(String(testUser._id))
        .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
        .setIssuer("codesync-api")
        .setAudience("codesync-web")
        .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
        .sign(secret);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Token has expired");
    });
  });
});
