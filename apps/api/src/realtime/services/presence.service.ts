import { SocketUser, PresenceUser } from "@codesync/types";

// Palette of colors for deterministic assignment
const CURSOR_COLORS = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A1",
  "#33FFF6",
  "#F6FF33",
  "#FF8C33",
  "#8C33FF",
  "#33FF8C",
  "#FF3333",
  "#3333FF",
  "#33FF33",
];

function getColorForUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
}

class PresenceService {
  // Map of socketId to SocketUser
  private activeConnections = new Map<string, SocketUser>();
  // Map of userId to Set of socketIds (for users with multiple tabs open)
  private userSockets = new Map<string, Set<string>>();
  // Map of roomId to Map of userId to PresenceUser
  private roomPresence = new Map<string, Map<string, PresenceUser>>();
  // Map of socketId to Set of roomIds (to clean up on disconnect)
  private socketRooms = new Map<string, Set<string>>();

  addConnection(socketId: string, user: SocketUser) {
    this.activeConnections.set(socketId, user);

    if (!this.userSockets.has(user.id)) {
      this.userSockets.set(user.id, new Set());
    }
    this.userSockets.get(user.id)!.add(socketId);

    if (!this.socketRooms.has(socketId)) {
      this.socketRooms.set(socketId, new Set());
    }
  }

  removeConnection(socketId: string): string[] {
    const user = this.activeConnections.get(socketId);
    if (!user) return [];

    const affectedRooms: string[] = [];

    // Remove from all rooms
    const rooms = this.socketRooms.get(socketId) || new Set();
    for (const roomId of rooms) {
      if (this.leaveRoom(roomId, socketId) !== null) {
        affectedRooms.push(roomId);
      }
    }

    this.socketRooms.delete(socketId);
    this.activeConnections.delete(socketId);

    const userSocketsSet = this.userSockets.get(user.id);
    if (userSocketsSet) {
      userSocketsSet.delete(socketId);
      if (userSocketsSet.size === 0) {
        this.userSockets.delete(user.id);
      }
    }

    return affectedRooms;
  }

  joinRoom(roomId: string, socketId: string, user: SocketUser): PresenceUser[] {
    if (!this.roomPresence.has(roomId)) {
      this.roomPresence.set(roomId, new Map());
    }

    const roomUsers = this.roomPresence.get(roomId)!;

    if (!roomUsers.has(user.id)) {
      roomUsers.set(user.id, {
        userId: user.id,
        name: user.name,
        email: user.email,
        color: getColorForUserId(user.id),
        joinedAt: new Date().toISOString(),
      });
    }

    if (this.socketRooms.has(socketId)) {
      this.socketRooms.get(socketId)!.add(roomId);
    }

    return Array.from(roomUsers.values());
  }

  leaveRoom(roomId: string, socketId: string): PresenceUser[] | null {
    const user = this.activeConnections.get(socketId);
    if (!user) return null;

    if (this.socketRooms.has(socketId)) {
      this.socketRooms.get(socketId)!.delete(roomId);
    }

    // Check if user has other sockets in this room
    const otherSocketsInRoom = Array.from(this.userSockets.get(user.id) || []).some(
      (sid) => sid !== socketId && this.socketRooms.get(sid)?.has(roomId)
    );

    const roomUsers = this.roomPresence.get(roomId);
    if (!roomUsers) return null;

    if (!otherSocketsInRoom) {
      roomUsers.delete(user.id);

      if (roomUsers.size === 0) {
        this.roomPresence.delete(roomId);
      }

      return Array.from(roomUsers.values());
    }

    return null; // Return null to indicate no presence broadcast is needed (user still in room with another tab)
  }

  getRoomUsers(roomId: string): PresenceUser[] {
    const roomUsers = this.roomPresence.get(roomId);
    return roomUsers ? Array.from(roomUsers.values()) : [];
  }

  getUserBySocketId(socketId: string): SocketUser | undefined {
    return this.activeConnections.get(socketId);
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  getUserSockets(userId: string): string[] {
    const sockets = this.userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  getAllOnlineUsers(): SocketUser[] {
    const users = new Map<string, SocketUser>();
    for (const user of this.activeConnections.values()) {
      users.set(user.id, user);
    }
    return Array.from(users.values());
  }
}

export const presenceService = new PresenceService();
