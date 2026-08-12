import { presenceService } from "../src/realtime/services/presence.service.js";

describe("PresenceService", () => {
  beforeEach(() => {});

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should add user to room presence", () => {
    const roomId = "room-1";
    const socketId = "socket-1";
    const user = { id: "user-1", name: "User 1", email: "user1@test.com", role: "user" };

    presenceService.addConnection(socketId, user);
    const users = presenceService.joinRoom(roomId, socketId, user);

    expect(users).toHaveLength(1);
    expect(users[0].userId).toBe("user-1");
    expect(users[0].name).toBe("User 1");
  });

  it("should handle multiple sockets for same user in same room gracefully", () => {
    const roomId = "room-2";
    const user = { id: "user-2", name: "User 2", email: "user2@test.com", role: "user" };

    presenceService.addConnection("socket-2a", user);
    presenceService.addConnection("socket-2b", user);

    presenceService.joinRoom(roomId, "socket-2a", user);
    const users = presenceService.joinRoom(roomId, "socket-2b", user);

    expect(users).toHaveLength(1); // Still only 1 unique user in room

    const leftUsers = presenceService.leaveRoom(roomId, "socket-2a");
    expect(leftUsers).toBeNull(); // User still in room via socket-2b

    const leftUsersFinal = presenceService.leaveRoom(roomId, "socket-2b");
    expect(leftUsersFinal).toEqual([]); // Room is now empty
  });

  it("should remove user from room on disconnect", () => {
    const roomId = "room-3";
    const socketId = "socket-3";
    const user = { id: "user-3", name: "User 3", email: "user3@test.com", role: "user" };

    presenceService.addConnection(socketId, user);
    presenceService.joinRoom(roomId, socketId, user);

    const affectedRooms = presenceService.removeConnection(socketId);
    expect(affectedRooms).toContain(roomId);

    const users = presenceService.getRoomUsers(roomId);
    expect(users).toHaveLength(0);
  });
});
