import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChat } from "../src/socket/hooks/useChat.js";
import { SocketEvents } from "@codesync/types";

describe("useChat", () => {
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
      emit: vi.fn((event, data, callback) => {
        if (event === SocketEvents.CHAT_GET_HISTORY) {
          if (callback) {
            callback({
              success: true,
              data: {
                roomId: "room-1",
                hasMore: false,
                messages: [
                  {
                    id: "msg-1",
                    roomId: "room-1",
                    content: "History message",
                    sender: { id: "u1", name: "User 1" },
                    createdAt: new Date().toISOString(),
                  },
                ],
              },
            });
          }
        } else if (event === SocketEvents.CHAT_SEND_MESSAGE) {
          if (callback) {
            callback({
              success: true,
              data: {
                id: "msg-2",
                roomId: "room-1",
                content: data.content,
                sender: { id: "u1", name: "User 1" },
                createdAt: new Date().toISOString(),
              },
            });
          }
        }
      }),
    };
  });

  it("should fetch history on join", () => {
    const { result } = renderHook(() => useChat(mockSocket, "room-1", true));

    expect(mockSocket.emit).toHaveBeenCalledWith(
      SocketEvents.CHAT_GET_HISTORY,
      { roomId: "room-1", limit: 50, before: undefined },
      expect.any(Function)
    );

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe("History message");
  });

  it("should append new message on CHAT_MESSAGE", () => {
    const { result } = renderHook(() => useChat(mockSocket, "room-1", true));

    act(() => {
      listeners[SocketEvents.CHAT_MESSAGE]({
        id: "msg-new",
        roomId: "room-1",
        content: "New real-time message",
        sender: { id: "u2", name: "User 2" },
        createdAt: new Date().toISOString(),
      });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].content).toBe("New real-time message");
  });

  it("should ignore messages from other rooms", () => {
    const { result } = renderHook(() => useChat(mockSocket, "room-1", true));

    act(() => {
      listeners[SocketEvents.CHAT_MESSAGE]({
        id: "msg-new",
        roomId: "room-2", // Different room
        content: "New real-time message",
        sender: { id: "u2", name: "User 2" },
        createdAt: new Date().toISOString(),
      });
    });

    // Should only have the initial history message
    expect(result.current.messages).toHaveLength(1);
  });

  it("should send a message and handle errors", () => {
    const { result } = renderHook(() => useChat(mockSocket, "room-1", true));

    act(() => {
      result.current.sendMessage("Hello there");
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      SocketEvents.CHAT_SEND_MESSAGE,
      { roomId: "room-1", content: "Hello there" },
      expect.any(Function)
    );

    // Simulate error from server
    act(() => {
      listeners[SocketEvents.CHAT_ERROR]({
        code: "CHAT_ERROR",
        message: "You cannot send messages here",
      });
    });

    expect(result.current.error).toBe("You cannot send messages here");
  });
});
