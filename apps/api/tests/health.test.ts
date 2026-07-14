import request from "supertest";
import app from "../src/app.js";
import mongoose from "mongoose";
import { jest } from "@jest/globals";

// Mock mongoose library directly
jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose") as any;
  return {
    ...actualMongoose,
    connect: (jest.fn() as any).mockResolvedValue(null as any),
    disconnect: (jest.fn() as any).mockResolvedValue(null as any),
    connection: {
      ...actualMongoose.connection,
      readyState: 1, // Default to connected (1)
      on: jest.fn(),
    },
  };
});

describe("GET /api/health", () => {
  it("should return 200 OK with correct status structure", async () => {
    (mongoose.connection as any).readyState = 1;

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("environment");
    expect(res.body.services).toEqual({ database: "connected" });
  });

  it("should return status error when database is disconnected", async () => {
    (mongoose.connection as any).readyState = 0; // Disconnected (0)

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "error");
    expect(res.body.services).toEqual({ database: "disconnected" });
  });
});
