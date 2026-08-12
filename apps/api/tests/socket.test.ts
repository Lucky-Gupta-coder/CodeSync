import { Server } from "socket.io";
import { createServer } from "http";
import Client, { Socket as ClientSocket } from "socket.io-client";
import { socketManager } from "../src/realtime/server/socket.manager.js";
import { jwtService } from "../src/shared/auth/jwt.service.js";
import { SocketEvents, UserRole } from "@codesync/types";
import { presenceService } from "../src/realtime/services/presence.service.js";

describe("Socket Server Tests", () => {
  let io: Server;
  let clientSocket: ClientSocket;
  let serverSocket: any;
  let port: number;
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    role: UserRole.MEMBER,
  };

  beforeAll((done) => {
    const httpServer = createServer();
    socketManager.initialize(httpServer);
    io = socketManager.getIO();
    httpServer.listen(() => {
      port = (httpServer.address() as any).port;
      done();
    });
  });

  afterAll(() => {
    io.close();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    jest.clearAllMocks();
  });

  it("should reject connection if no token is provided", (done) => {
    clientSocket = Client(`http://localhost:${port}`);
    clientSocket.on("connect_error", (err) => {
      expect(err.message).toBe("Authentication error: Token not provided");
      done();
    });
  });

  it("should reject connection if token is invalid", (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: "invalid-token" },
    });
    clientSocket.on("connect_error", (err) => {
      expect(err.message).toBe("Authentication error: Invalid or expired token");
      done();
    });
  });

  it("should connect successfully with valid token and receive authenticated event", async () => {
    const token = await jwtService.generateAccessToken({
      id: mockUser.id,
      name: "Test",
      email: mockUser.email,
      role: mockUser.role,
    });

    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token },
    });

    return new Promise<void>((resolve) => {
      clientSocket.on(SocketEvents.AUTHENTICATED, () => {
        expect(clientSocket.connected).toBeTruthy();
        const onlineUsers = presenceService.getAllOnlineUsers();
        expect(onlineUsers.some((u) => u.id === mockUser.id)).toBeTruthy();
        resolve();
      });
    });
  });

  it("should respond to ping with pong", async () => {
    const token = await jwtService.generateAccessToken({
      id: mockUser.id,
      name: "Test",
      email: mockUser.email,
      role: mockUser.role,
    });
    clientSocket = Client(`http://localhost:${port}`, { auth: { token } });

    return new Promise<void>((resolve) => {
      clientSocket.on(SocketEvents.PONG, () => {
        resolve();
      });

      clientSocket.on("connect", () => {
        clientSocket.emit(SocketEvents.PING);
      });
    });
  });
});
