import { io, Socket } from "socket.io-client";
import { SocketEvents, ServerToClientEvents, ClientToServerEvents } from "@codesync/types";

export class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  }

  public connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.baseUrl, {
      auth: {
        token,
      },
      transports: ["websocket"], // Use websockets instead of long polling for realtime performance
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public getSocket() {
    return this.socket;
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on("connect_error", (error: Error) => {
      console.error("Socket connection error:", error.message);
    });

    this.socket.on(SocketEvents.ERROR, (error) => {
      console.error("Socket application error:", error);
    });
  }
}

export const socketService = new SocketService();
