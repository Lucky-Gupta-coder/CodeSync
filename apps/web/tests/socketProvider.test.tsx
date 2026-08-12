import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SocketProvider } from "../src/socket/SocketProvider.js";
import { useSocket } from "../src/socket/hooks/useSocket.js";
import { useConnectionStatus } from "../src/socket/hooks/useConnectionStatus.js";
import { useAuthStore } from "../src/modules/auth/store/auth.store.js";
import { ConnectionState } from "@codesync/types";
import { socketService } from "../src/socket/socket.service.js";

// Mock zustand store
vi.mock("../src/modules/auth/store/auth.store.js", () => ({
  useAuthStore: vi.fn(),
}));

// Mock socketService
vi.mock("../src/socket/socket.service.js", () => {
  let callbacks: any = {};

  const mockSocket = {
    on: vi.fn((event, cb) => {
      callbacks[event] = cb;
    }),
    off: vi.fn((event) => {
      delete callbacks[event];
    }),
    _trigger: (event: string, ...args: any[]) => {
      if (callbacks[event]) {
        callbacks[event](...args);
      }
    },
  };

  return {
    socketService: {
      connect: vi.fn(),
      disconnect: vi.fn(),
      getSocket: vi.fn(() => mockSocket),
      _mockSocket: mockSocket,
    },
  };
});

describe("SocketProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const TestComponent = () => {
    const socket = useSocket();
    const status = useConnectionStatus();
    return (
      <div>
        <div data-testid="status">{status}</div>
        <div data-testid="socket">{socket ? "has-socket" : "no-socket"}</div>
      </div>
    );
  };

  it("should not connect when unauthenticated", () => {
    (useAuthStore as unknown as any).mockReturnValue({
      token: null,
      isAuthenticated: false,
    });

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    expect(screen.getByTestId("status").textContent).toBe(ConnectionState.DISCONNECTED);
    expect(screen.getByTestId("socket").textContent).toBe("no-socket");
    expect(socketService.connect).not.toHaveBeenCalled();
  });

  it("should connect when authenticated", () => {
    (useAuthStore as unknown as any).mockReturnValue({
      token: "valid-token",
      isAuthenticated: true,
    });

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Initial state immediately after render is CONNECTING before events fire
    expect(screen.getByTestId("status").textContent).toBe(ConnectionState.CONNECTING);
    expect(screen.getByTestId("socket").textContent).toBe("has-socket");
    expect(socketService.connect).toHaveBeenCalledWith("valid-token");

    // Simulate connection
    act(() => {
      (socketService as any)._mockSocket._trigger("connect");
    });

    expect(screen.getByTestId("status").textContent).toBe(ConnectionState.CONNECTED);
  });

  it("should throw error if useSocket is used outside provider", () => {
    // We expect this to throw an error, suppress React's default error logging for this test
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      "useSocket must be used within a SocketProvider"
    );

    consoleError.mockRestore();
  });

  it("should disconnect on unmount", () => {
    (useAuthStore as unknown as any).mockReturnValue({
      token: "valid-token",
      isAuthenticated: true,
    });

    const { unmount } = render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    unmount();
    expect(socketService.disconnect).toHaveBeenCalled();
  });
});
