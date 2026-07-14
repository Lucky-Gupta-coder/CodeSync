import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../src/App.js";

// Mock the API client to prevent network requests during vitest runs
vi.mock("../src/api/client.ts", () => ({
  apiClient: {
    get: vi.fn().mockImplementation(() =>
      Promise.resolve({
        data: {
          status: "ok",
          timestamp: new Date().toISOString(),
          environment: "test",
          services: { database: "connected" },
        },
      })
    ),
  },
}));

describe("React App Mounts Cleanly", () => {
  it("should render the main application header title", () => {
    render(<App />);
    expect(screen.getByText("Collaborative Developer Workspace")).toBeInTheDocument();
  });

  it("should render the StatusCard container", () => {
    render(<App />);
    expect(screen.getByText("System Status")).toBeInTheDocument();
  });
});
