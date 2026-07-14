import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import { User } from "../src/modules/user/user.model.js";
import argon2 from "argon2";

const TEST_MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/codesync_test";

describe("POST /api/auth/register", () => {
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
    expect(res.body.data.role).toBe("member");
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
