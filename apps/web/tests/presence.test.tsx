import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePresence } from "../src/socket/hooks/usePresence.js";
import { SocketEvents } from "@codesync/types";

describe("usePresence", () => {
  let mockSocket: any;
  let listeners: Record<string, Function> = {};

  beforeEach(() => {
    listeners = {};
    mockSocket = {
      on: vi.fn((event, callback) => {
        listeners[event] = callback;
      }),
      off: vi.fn((event) => {
        delete listeners[event];
      }),
      emit: vi.fn(),
    };
  });

  it("should update users on PRESENCE_UPDATE", () => {
    const { result } = renderHook(() => usePresence(mockSocket, "room-1"));

    act(() => {
      listeners[SocketEvents.PRESENCE_UPDATE]({
        roomId: "room-1",
        users: [{ userId: "u1", name: "Test User", color: "#fff" }],
      });
    });

    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0].userId).toBe("u1");
  });

  it("should update cursors on CURSOR_UPDATE", () => {
    const { result } = renderHook(() => usePresence(mockSocket, "room-1"));

    act(() => {
      listeners[SocketEvents.CURSOR_UPDATE]({
        roomId: "room-1",
        userId: "u2",
        position: {
          lineNumber: 1,
          column: 1,
          selectionStartLineNumber: 1,
          selectionStartColumn: 1,
          selectionEndLineNumber: 1,
          selectionEndColumn: 1,
        },
      });
    });

    expect(result.current.cursors["u2"]).toBeDefined();
    expect(result.current.cursors["u2"]?.lineNumber).toBe(1);
  });
});
