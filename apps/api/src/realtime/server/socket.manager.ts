import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  CodeSyncSocket,
} from "../types/socket.types.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.js";
import { handleConnection } from "../handlers/connection.handler.js";
import { handleRoomEvents } from "../handlers/room.handler.js";
import { handleDocumentEvents } from "../handlers/document.handler.js";
import { handlePresenceEvents } from "../handlers/presence.handler.js";
import { socketLogger } from "../utils/socket.logger.js";
import { handleSocketError } from "../middleware/socket.error.js";

export class SocketManager {
  private static instance: SocketManager;
  private io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > | null = null;

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public initialize(httpServer: HttpServer) {
    const allowedOrigins = [
      process.env.CORS_ORIGIN || "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://[::1]:5173",
    ];

    this.io = new Server(httpServer, {
      cors: {
        origin: (
          origin: string | undefined,
          callback: (err: Error | null, allow?: boolean) => void
        ) => {
          if (!origin) {
            return callback(null, true);
          }
          if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    socketLogger.info("Socket.IO Server initialized");

    this.setupMiddlewares();
    this.setupNamespaces();
  }

  private setupMiddlewares() {
    if (!this.io) return;
    this.io.use(socketAuthMiddleware);
  }

  private setupNamespaces() {
    if (!this.io) return;

    this.io.on("connection", (socket: CodeSyncSocket) => {
      try {
        handleConnection(socket);
        handleRoomEvents(socket);
        handleDocumentEvents(socket);
        handlePresenceEvents(socket);
      } catch (error) {
        handleSocketError(socket, error, "Connection Setup");
      }
    });

    this.io.engine.on("connection_error", (err: any) => {
      socketLogger.error("Socket Engine Connection Error", err);
    });
  }

  public getIO() {
    if (!this.io) {
      throw new Error("SocketManager not initialized. Call initialize() first.");
    }
    return this.io;
  }
}

export const socketManager = SocketManager.getInstance();
