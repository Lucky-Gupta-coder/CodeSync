import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../src/App.js";
import { useAuthStore } from "../src/modules/auth/store/auth.store.js";
import { UserRole } from "@codesync/types";

// Mock the API client to prevent network requests during vitest runs
vi.mock("../src/api/client.ts", () => ({
  apiClient: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              id: "123",
              name: "Mock Dashboard User",
              email: "mock@example.com",
              role: UserRole.MEMBER,
            },
          },
        });
      }
      return Promise.resolve({
        data: {
          status: "ok",
          timestamp: new Date().toISOString(),
          environment: "test",
          services: { database: "connected" },
        },
      });
    }),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));

describe("React App Mounts Cleanly", () => {
  beforeEach(() => {
    // Authenticate user to bypass ProtectedRoute guard
    useAuthStore.getState().login("mock_token", {
      id: "123",
      name: "Mock Dashboard User",
      email: "mock@example.com",
      role: UserRole.MEMBER,
    });
  });

  it("should render the main application header title", async () => {
    render(<App />);
    expect(await screen.findByText("Collaborative Developer Workspace")).toBeInTheDocument();
  });

  it("should render the StatusCard container", async () => {
    render(<App />);
    expect(await screen.findByText("System Status")).toBeInTheDocument();
  });
});
